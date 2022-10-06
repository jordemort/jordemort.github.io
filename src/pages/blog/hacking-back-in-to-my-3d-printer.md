---
title: Hacking back in to my 3D printer
description: Physical access as a solution for forgetfulness
tags:
  - raspberrypi
  - passwd
  - shadow
  - openssl
  - security
---

Illnois has a wonderful law called the [Biometric Information Privacy Act](https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004&ChapterID=57), which places limits on how biometric data can be collected and used.
Perhaps because it is an Illinois-specific law, it often gets overlooked by big tech companies that love to collect data.
As a result, the average Illinois resident will get at least a couple notices a year that they are eligible to participate in a class-action lawsuit against a company that has violated the law.
Facebook is among the many companies that have [violated BIPA](https://www.facebookbipaclassaction.com/), and as a result, which led to me receiving a check for $600 as part of their settlement last year.

I spent that $600 on an [Ender-3 S1](https://www.creality.com/products/creality-ender-3-s1-3d-printer) 3D printer and a bunch of accessories for it.
One of those accessories was a Raspberry Pi to run [Mainsail OS](https://docs.mainsail.xyz/) and [Klipper](https://www.klipper3d.org/).
This gives my printer capabilities equivalent to a much more expensive model.
After a few weeks of printing all sorts of weird nonsense, my excitement died down, and I went without printing anything for a few months.

More recently, I became annoyed at my iPhone bumper, because the part that covers the power button had gone all squishy and no longer transmitted sufficient tactile feedback to know if the button had been pressed or not.
Bumper-style cases are harder to find to begin with, and my phone is a bit older, so I decided to [print a replacement](https://www.thingiverse.com/thing:4633951).

Unfortunately, in the months since I had last used the printer, something had gone wrong; I could ping the machine and SSH to it, but I could no longer open the web interface.
What's more, I had forgotten the password I had set for the `pi` user.
My SSH key was on the machine, so I could log on, but I wasn't able to become root to dig around in the journal.
I could have flashed a new SD card with a fresh copy of Mainsail OS, but I did a lot of customization when I set things up (and didn't write anything down :disappointed:) and I didn't want to lose all of that.

What ever shall I do?
It's time for a very basic physical security attack.

## Why is physical security important?

If a machine won't let you become root, and you have physical access to it, you can simply pull the disk out of it and attach it to a machine where you already have root.
In this case, my victim is a Raspberry Pi, so the storage is a very conveniently removable SD card.

### 1. Put the SD card in another machine

Yank the SD card and plug it into a machine where you have root access.
In my case, I'm using my Fedora [Silverblue](https://silverblue.fedoraproject.org/about) VM on my Mac. I have a big Linux box too, but it's in a rack so it's inconvenient to plug things into it.

### 2. Mount the root filesystem

Mount the root filesystem on the SD card somewhere on the machine where you have root.
In my case, Fedora helpfully mounted the partitions for me when the card was plugged in, at `/run/user/jordan/boot` and `/run/user/jordan/rootfs`.
If you're working with an SD card for a Raspberry Pi, be aware that they typically contain two partitions -- a "boot" partition contains the firmware, while a "rootfs" partition contains the Linux system.
Make sure you're working on the rootfs partition.
It will generally be the larger of the two.

If you're not sure if your host automatically mounted things for you, type [`mount`](https://manpages.debian.org/bullseye/mount/mount.8.en.html) and look for something that looks like it might be the SD card:

```
# mount
sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
...
```

If you're still not sure, [`lsblk`](https://manpages.debian.org/bullseye/util-linux/lsblk.8.en.html) can be used to list the disks currently attached to your system.
Look for something that looks around the size of your SD card:

```
# lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
sda           8:0    0   7.3T  0 disk
├─sda1        8:1    0   7.3T  0 part
└─sda9        8:9    0     8M  0 part
...
```

If you find your SD card in the output of `lsblk` but it doesn't appear to be mounted according to `mount`, then you can mount it manually.
If your SD card's rootfs partition is at `/dev/sdc2`, you might do something like:

```
# mount /dev/sdc2 /mnt
```

### 3. Generate a new password hash

Passwords on a Linux system are stored in hashed form.
This means the password is put through a one-way function that scrambles it into something resembling meaningless nonsense.
When you try to log in, the system scrambles the password you entered using the same one-way function, and checks to see if the hashes match.
This is a security measure; in theory, an attacker who steals your password hash won't be able to figure out what your original password was; in practice, this protection is far from perfect, and it's better to keep your password hashes out of the hands of potentially malicious folks.
More on this below.

There are probably ways of making [`passwd`](https://manpages.debian.org/bullseye/passwd/passwd.1.en.html) work against a different root filesystem to change the password on the SD card in the "normal" way, but that seems annoying and potentially mildly risky to the host to me, so I'm going to use the  [`openssl passwd`](https://www.openssl.org/docs/man3.0/man1/openssl-passwd.html) command to generate a new hash instead:

```
$ openssl passwd -6
Password:
Verifying - Password:
$6$h.tStr5BSUHzn38d$9hkd.10l7B6lCS9RUw.L5Gv8rA/kWH6FEwd/LX2jt6qK3cgsqlznUnezn35m.LULv2y3uGbbWSpvfV8NOqTWN1
```

Note that `-6` seems to be a pretty recent addition to `openssl passwd`; if your version doesn't have it, you can try `-1` to generate an MD5 password hash instead.
Be forewarned that this is a much weaker (easier to crack) hash algorithm than the SHA512 employed by `-6`, and you should change the password again immediately with `passwd` once you are able to log back into the machine.

### 4. Change the password hash in `/etc/shadow`

UNIX-like operating systems store the user database in [`/etc/passwd`](https://manpages.debian.org/bullseye/passwd/passwd.5.en.html).
The password hashes used to be stored there too, but most systems converted to something called [shadow passwords](https://kb.iu.edu/d/aezz) long ago.
`/etc/passwd` needs to be readable by everybody on the system, in order to display file and process ownership information; having the password hashes there meant that everybody was able to grab them.

Hashing the passwords provides some level of protection, but it's better to keep the hashes out of the hands potentially malicious folks altogether.
Once an attacker has your password hash, they can spend as much time and money as they want to throw computing power at the task of [cracking it](https://www.openwall.com/john/), or they might be able to look it up in a [big list of password hashes someone already cracked](https://en.wikipedia.org/wiki/Rainbow_table).

Shadow passwords are the solution that the ancestral system administrators settled on.
Instead of storing the hash in `/etc/passwd`, which has to be world-readable, the password hashes are stored in a separate file called [`/etc/shadow`](https://manpages.debian.org/bullseye/passwd/shadow.5.en.html).
This file is readable and writable only to `root` and to a special `shadow` group.
Tools that users use to change their password need to be marked with a [setgid bit](https://en.wikipedia.org/wiki/Setuid) to make them run as this special group; it's also very important that those tools are carefully written to prevent the user from doing unexpected things, or the additional security offered by shadow passwords could be compromised.

If I didn't have physical access, I would have to find another way to become `root` or to execute arbitrary code as the `shadow` group.
Fortunately, with the SD card plugged in to a machine where I already have `root`, I can just edit the `shadow` file directly.

**HEY, LISTEN:** If you're playing along at home, remember to edit the shadow file of the disk you mounted, and not of your system.
In my case, I'm editing `/run/user/jordan/rootfs/etc/shadow`.

Both `/etc/passwd` and `/etc/shadow` are text files.
Each contains one line per user, with fields separated by a `:` character.
The first field is in the username.
In `/etc/shadow`, the second field is the password hash; `*` indicates that the user doesn't have a password set.
The rest of the fields are information about when the password was last changed, when it expires, etc:

```
root:*:19020:0:99999:7:::
daemon:*:19020:0:99999:7:::
bin:*:19020:0:99999:7:::
sys:*:19020:0:99999:7:::
... and so on ...
pi:$6$3VZDnWyi6gcW6KIS$rUsq5FuWncQD843t31psB7.gDb9qw1hnyCCtWzF0NXraZJdHJVxlTqRZbjDiavXG6vHTXoVhrNXwpTIjAKrbv.:19138:0:99999:7:::
```

I've found the line for pi in the shadow file, now I just need to replace the password hash with the one I generated:

```
pi:$6$h.tStr5BSUHzn38d$9hkd.10l7B6lCS9RUw.L5Gv8rA/kWH6FEwd/LX2jt6qK3cgsqlznUnezn35m.LULv2y3uGbbWSpvfV8NOqTWN1:19138:0:99999:7:::
```

...and save the file.

### 5. Wrap up

Unmount the SD card and put it back into the Raspberry Pi.
Boot it up and log in with your new password.

<div style="width:100%;height:0;padding-bottom:100%;position:relative;"><iframe src="https://giphy.com/embed/d7IaKUMk8RqtFjT71B" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe></div><p><a href="https://giphy.com/gifs/americangods-season-3-starz-american-gods-d7IaKUMk8RqtFjT71B">via GIPHY</a></p>
