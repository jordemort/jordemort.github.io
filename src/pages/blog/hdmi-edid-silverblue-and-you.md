---
title: HDMI, Sliverblue, Remote Desktop, and you
description: HDMI! It's an unlimited supply!
tags:
  - hdmi
  - edid
  - fedora
  - silverblue
  - ostree
  - rpm-ostree
  - kargs
  - initramfs
  - headless
  - remote-desktop
  - rdp
  - fpm
---

I've been using some of my holiday downtime to shuffle my personal infrastructure around.
As a result, I found myself seeing a new purpose in life for my [NUC8i5BEK](https://www.intel.com/content/www/us/en/products/sku/126147/intel-nuc-kit-nuc8i5bek/specifications.html).
I bought this machine in 2018 to use as an HTPC in my living room, but my family quickly discovered that nobody likes having to fuss with a computer when they just want to watch a show.
It's been bouncing around doing odd jobs ever since; at one point it was the build server for [Seam](https://www.seam.co/).
More recently, it's been running [Home Assistant](https://www.home-assistant.io/), but a machine with a Core i5 and 16 GiB of RAM is massively overpowered for that particular task, so I stuffed Home Assistant into a VM on another machine and wiped the NUC.

I do a lot of Linux work, but my daily driver is a MacBook Pro, mostly because you will have to pry Mail.app from my cold, dead hands.
This means I send a lot of time in SSH sessions.
Up until now, most of my work has been happening in a [systemd-nspawn](https://www.freedesktop.org/software/systemd/man/systemd-nspawn.html) container running on the server that hosts my gigantic ZFS array, but based on the principle of "don't shit where you eat," I've been wanting to move away from that, so I decided to designate the NUC as my new Linux dev box.

## Enter Silverblue

I am at the age where I want the operating systems that I rely on to get work done to be as boring as possible.
Usually this means I pick Debian stable, or an Ubuntu LTS, but I picked up a taste for [OSTree](https://ostreedev.github.io/ostree/) during adventures in the embedded space.
OSTree works a bit like Git, except it's designed to manage Linux root filesystems.
It uses [content-addressable storage](https://en.wikipedia.org/wiki/Content-addressable_storage) &mdash; all of the files in an OSTree repository are given a name which is calculated based on a hash of their contents.
Commits in an OSTree repository contain a list of filenames and their corresponding hashes; a particular file can appear in many commits, but only one copy of it will be stored.
OSTree solves a lot of problems for OS builders like me; updates are smaller, can be applied atomically, and it's easy to roll back to a previous version of the system without having to waste storage on an A/B partition scheme.

OSTree is more commonly found in embedded systems, but it's been adopted by a few desktop distributions.
[Endless OS](https://endlessos.com/) marries OSTree a Debian-style package manager, which sounds like it ought to be right up my alley, but it's relatively new and seems to be built mostly for children and novices.
They also prominently link to a [redistribution policy](https://endlessos.com/redistribution-policy/) which gives me weird vibes for a Linux distro.
Between that and my preference for a maximally-vanilla GNOME, I decided to go with [Fedora Silverblue](https://silverblue.fedoraproject.org/) instead.

Fedora used to scare me a bit.
I've had my share of extremely bad times with RPM, and I tend to prefer software that has a shelf-life measured in years rather than months.
Silverblue wraps all the potential RPM weirdness in OSTree, though, so if I completely break things I can quickly flip back to a working version.
This is also going to be a high-touch machine; while I mostly prefer my servers to be [set-and-forget](/blog/responsible-negligence/), I'll probably be logging into this thing most of my workdays, and I'm going to want the latest and greatest of everything to be easily accessible.
Hearing a bunch of people I respect speak well of Fedora in recent years has made me confident enough to take the Fedora plunge (with a sturdy OSTree parachute strapped firmly to my back.)

The process of getting Silverblue installed was extremely boring, in a good way.
Write the ISO to a USB key, boot it, clicky clicky, and it's up and running.
Let's fast-forward to the point where I ran into a problem.

## No monitor, no remote desktop?

I've got a [cheap little KVM](https://www.aliexpress.us/item/2255801044364416.html?invitationCode=UW9saDRZMmNsRWhYUEREQ2l5cmlxM29KRWJld3dQREFyTitiSERhdUZpU2xzdy8rRjhVT3dnPT0&srcSns=sns_Copy&spreadType=productdetail&bizType=sellerinvite&social_params=60000386308&spreadCode=UW9saDRZMmNsRWhYUEREQ2l5cmlxM29KRWJld3dQREFyTitiSERhdUZpU2xzdy8rRjhVT3dnPT0&aff_fcid=eae6e38a551e4fe5b5c97d2e604f9053-1673022931974-00969-_BSpS8t&tt=MG&aff_fsk=_BSpS8t&aff_platform=default&sk=_BSpS8t&aff_trace_key=eae6e38a551e4fe5b5c97d2e604f9053-1673022931974-00969-_BSpS8t&shareId=60000386308&businessType=ProductDetail&platform=AE&terminal_id=465731ea6e5442f9b1c8fce2c93696f9&afSmartRedirect=y&gatewayAdapt=glo2usa4itemAdapt&_randl_shipto=US) on my desk, with my MacBook's Thunderbolt dock on one port and the NUC on another.
It's reliable, but as to be expected for a device that costs less than $50, it does not attempt any sort of USB or HDMI emulation - it just passes signals through to whatever port is currently selected (this is probably why it is reliable.)
Switching from one port to another "unplugs" the monitor and USB devices from the machine you're switching away from, and "plugs" them into the machine you're switching to.

Switching from the Mac to the NUC, everything is fine; the Mac sees the monitor is unplugged, and all of the applications running on the Mac pack up their bindles and crowd in to the laptop's built-in display.
Switching from the NUC to the Mac is not so happy; it doesn't have a built-in display, so when it's not the active port, it has zero monitors connected.
Everything stays running and comes back fine when I switch back to the NUC, but having no monitors connected to it causes a different sort of problem.

GNOME has RDP support by way of [gnome-remote-desktop](https://gitlab.gnome.org/GNOME/gnome-remote-desktop); this works great with Microsoft's [Remote Desktop](https://apps.apple.com/us/app/microsoft-remote-desktop/id1295203466?mt=12) client for the Mac, but only when a monitor is connected to the NUC.
When there is no monitor connected, it doesn't work at all; instead, it gives me the dreaded "error 0x204."

### Why, though?

Most of my desire for a Linux desktop stems from one particular application; SSH is good to get most of my work done but sometimes I want to run [Ghidra](https://ghidra-sre.org/).
Running it natively on the Mac is very painful because of the code signing stuff in macOS, and running it through XQuartz is [dicey](https://github.com/XQuartz/XQuartz/issues/31).

Even though I have the KVM, I would also like to be able to connect to the desktop of the NUC remotely; I might want the NUC's desktop in a smaller window while I work on other things on the Mac, or I might want to access the desktop while not physically at my desk.

## Faking a connected monitor

There are [dongles](https://www.aliexpress.us/item/3256802247755691.html?gatewayAdapt=glo2usa4itemAdapt&_randl_shipto=US) you can purchase to fool an HDMI port into thinking a monitor is always connected, but one of my themes for the year is "try to make it work with what you already have instead of blowing more money on it," so I decided to try and do it in software instead.
I am partially pleased to report that I was partially successful.

### Forcing a video mode

I found the [Forcing modes](https://wiki.archlinux.org/title/kernel_mode_setting#Forcing_modes) section on the Arch Linux wiki, which says that you can force a particular mode by passing a `video=` argument on the kernel command-line, in the following format:

```
video=<conn>:<xres>x<yres>[M][R][-<bpp>][@<refresh>][i][m][eDd]
```

Fields in `<angle brackets>` are required; fields in `[square brackets]` are optional.

`conn` identifies which video port you want to use.
Figuring this out can be unexpectedly complicated.
You can get a list of ports that the kernel knows about by running the following command:

```
$ echo /sys/class/drm/card*-*
```

On my NUC, this returns the following list:

```
/sys/class/drm/card0-DP-1
/sys/class/drm/card0-DP-2
/sys/class/drm/card0-HDMI-A-1
```

The name of the port is the name of its sysfs file, with the `cardX-` prefix stripped off.
So, the ports on my NUC are:

- `DP-1`
- `DP-2`
- `HDMI-A-1`

I'm not sure how this works out on systems with multiple video cards, but it's not a problem that I have right now.

My NUC has exactly one HDMI port on the back of it, and no visible DisplayPort, so I figured that `HDMI-A-1` was the output that I was looking for.
I was wrong!
The names are misleading;
even though I'm connected via HDMI, the kernel calls the port I'm connected to `DP-1`!

To figure out which port you actually need, ensure that a monitor is connected, and then look at the `status` file in each port's directory in sysfs:

```
jordan@knuckles:/sys/class/drm$ cat /sys/class/drm/card0-DP-1/status
connected
jordan@knuckles:/sys/class/drm$ cat /sys/class/drm/card0-DP-2/status
disconnected
jordan@knuckles:/sys/class/drm$ cat /sys/class/drm/card0-HDMI-A-1/status
disconnected
```

I have a 4k monitor, so I want the resolution to be fixed at 3840 by 2160 and 60hz.
I also want the port to be forced on, even if nothing is connected; the `e` suffix accomplishes this.
So I want to add this to my kernel command-line:

```
video=DP-1:3840x2160@60e
```

### Editing kernel arguments with `rpm-ostree`

OSTree has many benefits, but it can also cause some inconvenience for folks like me who are used to hacking the crap out of things.
In order to allow rolling back to a previous version of the system, OSTree needs to manage the bootloader configuration.
This means I can't just hack my `video=` parameter into `grub.cfg`; it will be overwritten the next time OSTree updates the configuration.

In order to manage the kernel arguments in Silverblue, I need to use the `rpm-ostree kargs` command:

```
rpm-ostree kargs --editor
```

This opens a text editor (in my case, [GNU nano](https://www.nano-editor.org/)) containing the arguments that the bootloader will pass to the kernel.
After you save the file and close the editor, `rpm-ostree` will rewrite the bootloader configuration, and you can reboot with your new kernel arguments.
You can put things on multiple lines, but `rpm-ostree` seems to squish it back all on to one line after you save the file.
I'm not sure OSTree's rollback mechanism can save you if you screw things up at this point, but you can always edit the arguments with the GRUB command-line when you boot the system.

## Partial success #1

After making this change, it seems that the HDMI port is always active, even when booting the machine with no monitor connected, but it won't do 3840x2160.
It comes up in 640x480 (yikes!) - even switching to the port and logging in, it will only allow a maximum resolution of 1024x768.
Remote desktop works, but also only at a maximum resolution of 1024x768.
That still sounds like a pretty big screen to me, because I am impossibly old and grew up playing games in 320x200, but it's actually uncomfortably small in a modern desktop environment.

## Dealing with the EDID

EDID stands for [Extended Display Identification Data](https://en.wikipedia.org/wiki/Extended_Display_Identification_Data).
This is a small block of data that your monitor sends to your video card; among other things, it describes which video modes the monitor is capable of.
The instructions on the Arch Wiki that I followed to force a video mode were immediately preceded by instructions for [overriding the EDID](https://wiki.archlinux.org/title/kernel_mode_setting#Forcing_modes_and_EDID).
I skipped that part because I'm lazy, but maybe doing that will help?

### Getting the EDID

The kernel includes some generic EDID files for common resolutions, but they only seem to go up to 1920x1080.
There are various long, drawn-out processes that you can go through to build an EDID from scratch, but they mostly involve abusing Xorg in one way or another and the NUC is running Wayland.
In the name of correctness and laziness, I decided it would be better to try and rip the EDID data from my monitor and use that.

The Arch Linux suggests the use of a tool called `get-edid` but also notes that you could try looking at `/sys/class/drm/$PORT/edid`.
I connected my monitor and booted up the NUC.
Sure enough, I found `/sys/class/drm/card0-DP-1/edid`; I copied this to a file in my home directory called `benq.bin` (I rock a [BenQ EW3270U](https://www.benq.com/en-us/monitor/home/ew3270u.html).)

### Overriding the EDID

If I wasn't running Silverblue, all I would need to do at this point is copy `benq.bin` into `/lib/firmware/edid` and then add this to my kernel command-line:

```
drm.edid_firmware=edid/benq.bin
```

Perhaps predictably, I've gone and made things hard on myself again by using Silverblue.
I can't just go dropping things into `/lib/firmware/edid` willy-nilly, because that part of the filesystem is part of the OSTree commit and is mounted read-only.
Even if I remounted it read-write, it would only last until the next update &mdash; since it isn't part of the OSTree repository, it won't be persisted in future versions of my system.

In order to get `rpm-ostree` to merge this file into my system and persist it across updates, I need to put it into an RPM package.
I've got a lot of RPM packaging in my past and I could _probably_ write a specfile by hand if I spent 30 minutes brushing up on the documentation, but again, I am lazy.
Instead, I decided to use good old [fpm](https://fpm.readthedocs.io/), which is great for cooking up packages without putting a lot of effort into it.

First, I create the directory structure and put my EDID inside of it:

```
$ mkdir -p ~/Source/edid-hack/lib/firmware/edid
$ cp benq.bin ~/Source/edid-hack/lib/firmware/edid
```

Then, I make a package:

```
$ cd ~/Source/edid-hack
$ fpm -s dir -t rpm -n benq-edid-firmware .
```

This creates a package called `benq-edid-firmware-1.0-1.x86_64.rpm`, which I then install with `rpm-ostree`:

```
$ rpm-ostree install ./benq-edid-firmware-1.0-1.x86_64.rpm
```

### Getting the EDID into the initramfs

Linux uses something called an [initramfs](https://en.wikipedia.org/wiki/Initial_ramdisk).
This is a bundle of files (usually device drivers, firmware, and essential utilities) that is loaded into memory by the bootloader along with the kernel; this allows the kernel to access these files before it's even found the disk that contains the root filesystem.

All variants of Fedora include a nice shiny graphical boot process, which means that they need to initialize the video card from the initramfs.
This means that installing my fake firmware package on to the root filesystem isn't enough; I also need to find a way to get `benq.bin` into the initramfs.

In other distributions, the initramfs is rebuilt whenever you update your kernel, but Silverblue doesn't do this by default; instead, it prefers to use a canned initramfs.
This is probably a better choice in general for an OSTree-based distribution, but it doesn't suit my particular needs right now.
Fortunately, this behavior can be changed with an `rpm-ostree` command:

```
rpm-ostree initramfs --enable
```

This will enable rebuilding the initramfs from files on the root filesystem.
It appears to pick up files from `/lib/firmware` automatically.

With my edid package installed and my initramfs rebuilt, I can finally run `rpm-ostree kargs --editor` and add `drm.edid_firmware=edid/benq.bin` to my kernel arguments

## Partial success #2

The NUC still boots and initializes the video without being connected to a monitor, but the login screen is 1920x1080.
It does go to 3840x2160 once I log in, though.
Remote desktop also works at 3840x2160.

## Open questions

This is mostly functional now, but there are still a few things I want to investigate:

### Can I get 3840x2160 on the login screen?

The login screen is 3840x2160 when I boot with the monitor connected.
Did I screw up the EDID extraction process somehow?
At some point I'll go back and try extracting it with the tool instead of copying out of `sysfs` and see if I get better results.

### Remote desktop without logging in first?

Remote desktop works, but only if I log in at the console first.
If the machine is freshly booted and sitting at the login screen, then remote desktop won't connect.

Is there a way to "globally" enable an RDP listener?
I've gotten that sort of setup working with [xrdp](https://github.com/neutrinolabs/xrdp) but getting that going is a whole other thing and I'm not sure if it's possible with gnome-remote-desktop.
I suspect it is not, and the RDP service is tied to a user's session :slightly_frowning_face:.

GNOME can be configured to automatically log me in, but I'm not into the idea of anyone in my office being able to get a session by just rebooting the machine.
I wonder if there's a way to have it automatically log me in but immediately lock the screen?
