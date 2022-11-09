---
title: Single sign-on with Mastodon and Traefik
description: With a special guest appearance by my fork of traefik-forward-auth
tags:
  - mastodon
  - traefik
  - traefik-forward-auth
  - oauth2
  - sso
  - rss
  - ttrss
  - rssbridge
---

Due to the ongoing meltdown of an inexplicably popular microblogging service, you've probably heard a lot about the Fediverse lately, and about [Mastodon](https://joinmastodon.org/) in particular.
I set up a Mastodon instance for myself earlier this year, and I've been enjoying using it as dumping ground for my random thoughts.
That's probably why the frequency of posting on this blog has gone down, while the quality has (hopefully) gone up - my less fully-formed ideas now have a place to go and bounce around a bit before they mature into blog posts.

One thing you should probably know about me is that I :heart: single-sign on so much that I named my dog after [Kerberos](https://web.mit.edu/Kerberos/).
He's not named after the mythical guardian of Hades; he's named after a network authentication protocol.

![Kerby the dog](/images/kerby.jpg "Kerby the dog")

I [self-host about a zillion different things](/blog/responsible-negligence/) and I'm always looking for ways to make that less annoying.
Having fewer logins to keep track of helps with that.

## I heard you like federated media

One of the other things I've been hosting for myself (for much, much longer than Mastodon) is [Tiny Tiny RSS](https://tt-rss.org/).
I've been particularly lazy with this one, and up until now, I've just been logging into it with the default `admin` account (yes, I changed the password!)
It's been on my list of things to spiff up "some day" and last week the day finally arrived - I decided that I should tie Tiny Tiny RSS's login into Mastodon, since I was logged into Mastodon all the time anyway.

To deal with things that should have RSS feeds but don't, I've also been hosting a copy of [RSS Bridge](https://rss-bridge.github.io/rss-bridge/) for myself, but haven't really been using it.
I set a password on it, because I don't want to generate feeds for the whole world, but I can never remember the password and it makes it inconvenient to subscribe to the feeds that it generates.
I thought it would be a lot more convenient if RSS Bridge was also behind the Mastodon login, if I could configure it in such a way that Tiny Tiny RSS could access it without authentication.

## Cast of characters

### Mastodon & OAuth2

[OAuth2](https://oauth.net/2/) is an authorization protocol.
It's a bit of a sprawling standard, and it can be used for lots of things.
I'm not going to get into the nuts and bolts of how it works here, because writing all of that up sounds like work, and if I'm going to go to that level of trouble, I'm going to pitch it to LWN and try and get paid for it :smile:.

Third-party applications that need to request permissions to do things with your account on some service often use OAuth2.
The application requests a token with the required permissions from the service; the service responds with a URL.
The user is redirected to that URL, where they are presented with a login page.
After they log in, they are redirected back to a URL controlled by the third-party application, carrying with them a token that allows the application to interact with the service.

Mastodon implements the service provider side of the OAuth2 protocol.
This is used by third-party clients, which send their users through an OAuth2 login flow in order to obtain a token that allows the client to read and post to the user's timeline.

### Traefik

[Traefik](https://traefik.io/) is a nifty little HTTP proxy that I run pretty much EVERYTHING through these days.
Traefik can listen to a Docker daemon, and create virtual hosts on the fly based on container labels.
To illustrate, here's a snippet from my `docker-compose.yml` for Mastodon:

```yaml
# mastodon/docker-compose.yml
services:
  web:
    ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mastodon.rule=Host(`social.example.com`)"
      - "traefik.http.services.mastodon.loadbalancer.server.port=3000"
```

When I start this container, Traefik creates a virtual host called `social.example.com` and starts forwarding requests to it to port 3000 of the container.
It also handles automatically provisioning an SSL certificate for the site from [Let's Encrypt](https://letsencrypt.org/) and renews it as necessary.
Bringing up a new service for me is as simple as adding a few labels to a container and starting it.

I want to be very clear on this point.
I **LOVE** Traefik.
If I wasn't already married, I would marry Traefik.

### Traefik Foward Auth

Traefik supports forwarding each incoming request to an authorization server.
Based on the response from the authorization server, Traefik will allow the request through, deny it, or redirect it to another URL.
The authorization server can also add additional headers to the request, which are forwarded along to the backend server.

The authorization server itself is an HTTP server.
The authorization protocol is relatively simple to implement, but OAuth2 is not, so I decided not to roll my own.
I found [thomseddon/traefik-forward-auth](https://github.com/thomseddon/traefik-forward-auth); the Generic OAuth2 provider looked like it would be almost perfect for my needs.
The only hitch was the `user-url`:

```
  --providers.generic-oauth.user-url=    URL used to retrieve user info
```

This is expecting a JSON document, with an `email` key that includes the user's email address:

```go
// User is the authenticated user
type User struct {
	Email string `json:"email"`
}
```

...

```go
// GetUser uses the given token and returns a complete provider.User object
func (o *GenericOAuth) GetUser(token string) (User, error) {
	var user User

	req, err := http.NewRequest("GET", o.UserURL, nil)
	if err != nil {
		return user, err
	}

	if o.TokenStyle == "header" {
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))
	} else if o.TokenStyle == "query" {
		q := req.URL.Query()
		q.Add("access_token", token)
		req.URL.RawQuery = q.Encode()
	}

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return user, err
	}

	defer res.Body.Close()
	err = json.NewDecoder(res.Body).Decode(&user)

	return user, err
}
```

Mastodon doesn't have an API endpoint that fits the bill, or any endpoint that returns a user's email address at all, as far as I can tell.
It does have an [`/api/v1/accounts/verify_credentials`](https://docs.joinmastodon.org/methods/accounts/) endpoint, though (scroll down a bit in that link, the Mastodon docs don't seem to have an anchor for `verify_credentials` that I can link directly to.)
This doesn't return the email address, but it does return a username that we could use:

```json
{
  "id": "14715",
  "username": "trwnh",
  "acct": "trwnh",
  "display_name": "infinite love ⴳ",
  ...
}
```

Out-of-the-box, `traefik-forward-auth` doesn't support customizing which key to use for the username; it always looks for `email`.
"That's fine," I thought; "I can always add it myself," and [so I did](https://github.com/thomseddon/traefik-forward-auth/compare/master...jordemort:traefik-forward-auth:generic-oauth-configurable-user).
When I went to make a pull request, though, I realized a couple of things:

- [Somebody else](https://github.com/maxisme) had already done this, and they [did it better than I did](https://github.com/thomseddon/traefik-forward-auth/pull/159)
- The maintainer had apparently lost interest in the project; the last release was from 2020 and the project was still built with Go 1.13.

In particular, building with old Go compilers isn't great because of Go's preference for static linking; the way to get fixes for security problems in the standard library is to rebuild your software with a newer version of Go.

I don't like running unmaintained software, but I also didn't see any other solutions I liked better, so I [forked the repository](https://github.com/jordemort/traefik-forward-auth).
I merged a bunch of good-looking pull requests that had been malingering upstream, moved up to Go 1.19, updated all the dependencies, and rewrote the Dockerfile to stuff the binary into a nonroot [distroless](https://github.com/GoogleContainerTools/distroless) image.

I'm not making any promises about maintenance of this repo to anyone else, but I set up [Dependabot](https://github.com/dependabot) to help me keep it <a href="https://www.youtube.com/watch?v=dasab33h1nQ">crescent fresh</a>.
At the very least, my fork should provide a slightly more solid starting point for you than upstream, if it's something you want to use.

## Setting up Mastodon & `traefik-forward-auth`

### Running Traefik

Sorry, but this post mostly assumes you've already got Traefik up and running to your liking; such is my attachment to it that it is like air to me.

Check out this [basic example](https://doc.traefik.io/traefik/user-guides/docker-compose/basic-example/) from the Traefik documentation, this [GitHub repo](https://github.com/frigi83/traefik-examples) for more in-depth examples, or [this guide](https://www.smarthomebeginner.com/traefik-docker-compose-guide-2022/) if you really want to know all about it.

### Getting DNS in order

Traefik will handle generating certificates for you, but as far as I know, it doesn't provision DNS records, so you'll need to add hostnames pointing to it for each application that you intend to run behind it.
In the examples here, I'm using four different hostnames:

- `social.example.com` is the Mastodon instance
- `whoami.example.com` will run [`containous/whoami`](https://hub.docker.com/r/containous/whoami) to help us verify our setup
- `reader.example.com` is Tiny Tiny RSS
- `rssbridge.example.com` is RSS Bridge

You'll need to create equivalent records at your DNS provider; how to get that done is dependent on who is serving your DNS and out of scope for this guide.

### Create an OAuth2 application in Mastodon

In order for `traefik-forward-auth` to talk OAuth2 to Mastodon, you'll need let Mastodon know about `traefik-forward-auth`.
You can do this in the "Development" section of the Mastodon administration interface:

![Mastodon admin interface: Development](/images/single-sign-on-with-mastodon/masto-admin-development.png "Mastodon admin interface: Development")

Click the "New application" button and you'll see something like this:

![Mastodon admin interface: New application](/images/single-sign-on-with-mastodon/masto-admin-new-app.png "Mastodon admin interface: New application")

Fill out the details like so:

![Mastodon admin interface: Application details](/images/single-sign-on-with-mastodon/masto-admin-app-details.png "Mastodon admin interface: Application details")

- Put something reasonable in "Application name"
- I don't think it matters what you put into "Application website" - I put in the URL to the instance of `whoami` that I'm going to run with `traefik-forward-auth`.
- Fill out "Redirect URL" to the path `/_oauth` on the domain of each application that you want to protect.

As I mentioned earlier, after you log into an OAuth2 service, it redirects you to a URL controlled by the application that you're logging in with.
In order to prevent abuse, you must tell Mastodon what URLs your application will be redirecting to in advance, in the "Redirect URI" field.
In our case, `traefik-forward-auth` will redirect (and intercept requests) to `/_oauth` on each site that it is protecting.

Below this is a list of "Scopes," which are actions that the application is allowed to take on a user's behalf.
Mastodon seems to assume that you want a very powerful token; the default permissions allow the application to do almost anything with your account.
That makes sense for Mastodon clients, but all we want `traefik-forward-auth` to do is verify if a user is logged in or not, so **uncheck everything except `read:accounts`**:

![Mastodon admin interface: Application scopes](/images/single-sign-on-with-mastodon/masto-admin-app-scopes.png "Mastodon admin interface: Application scopes")

After that, click "Save Changes," and Mastodon should present you with a client key and secret:

![Mastodon admin interface: Application keys](/images/single-sign-on-with-mastodon/masto-admin-app-keys.png "Mastodon admin interface: Application keys")

### Running `trafik-forward-auth`

Like pretty much everything else that I self-host, I run `traefik-forward-auth` with [Docker Compose](https://docs.docker.com/compose/).
Here's a basic `docker-compose.yml` for it:

```yaml
# trafik-forward-auth/docker-compose.yml
services:
  traefik-forward-auth:
    image: ghcr.io/jordemort/traefik-forward-auth:latest
    command: [] # we'll fill this in later
    ports:
      - "127.0.0.1:4181:4181"
    environment:
      - DEFAULT_PROVIDER=generic-oauth
      - PROVIDERS_GENERIC_OAUTH_AUTH_URL=https://social.example.com/oauth/authorize
      - PROVIDERS_GENERIC_OAUTH_TOKEN_URL=https://social.example.com/oauth/token
      - PROVIDERS_GENERIC_OAUTH_USER_URL=https://social.example.com/api/v1/accounts/verify_credentials
      - PROVIDERS_GENERIC_OAUTH_TOKEN_STYLE=header
      - PROVIDERS_GENERIC_OAUTH_SCOPE=read:accounts
      - PROVIDERS_GENERIC_OAUTH_CLIENT_ID=[Replace with "Client key" from Mastodon]
      - PROVIDERS_GENERIC_OAUTH_CLIENT_SECRET=[Replace with "Client secret" from Mastodon]
      - SECRET=[Replace with a random string]
      - USER_ID_PATH=acct
      - LOGOUT_REDIRECT=https://social.example.com/
    labels:
      - "traefik.enable=true"
      - "traefik.http.middlewares.traefik-forward-auth.forwardauth.address=http://127.0.0.1:4181"
      - "traefik.http.middlewares.traefik-forward-auth.forwardauth.authResponseHeaders=X-Forwarded-User"
      - "traefik.http.services.traefik-forward-auth.loadbalancer.server.port=4181"

  whoami:
    image: containous/whoami:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.whoami.rule=Host(`whoami.example.com`)"
      - "traefik.http.routers.whoami.middlewares=traefik-forward-auth"
```

As you can see, `traefik-forward-auth` is mostly configured via environment variables:

| Name | Value |
|------|-------|
| `DEFAULT_PROVIDER` | `generic-oauth` |
| `PROVIDERS_GENERIC_OAUTH_AUTH_URL` | `/oauth/authorize` on your Mastodon instance |
| `PROVIDERS_GENERIC_OAUTH_TOKEN_URL` | `/oauth/token` on your Mastodon instance |
| `PROVIDERS_GENERIC_OAUTH_USER_URL` | `/api/v1/accounts/verify_credentials` on your Mastodon instance |
| `PROVIDERS_GENERIC_OAUTH_TOKEN_STYLE` | `header` - not sure if it's necessary, but I set it to this and it's working and I'm not messing with it further |
| `PROVIDERS_GENERIC_OAUTH_SCOPE` | `read:accounts` - we only want to request permission to see if the account exists |
| `PROVIDERS_GENERIC_OAUTH_CLIENT_ID` | The "Client key" that Mastodon generated for your application |
| `PROVIDERS_GENERIC_OAUTH_CLIENT_SECRET` | The "Client secret" that Mastodon generated for your application |
| `SECRET` | Fill this in with a random string |
| `USER_ID_PATH` | `acct` (or `username`) - this is the key from the `USER_URL` that will be used as the username; I'm not sure what the difference is between `acct` and `username` in Mastodon's `verify_credentials` response but I picked `acct` |
| `LOGOUT_REDIRECT` | Where to redirect users after they log out; I used my Mastodon instance's homepage but `https://youtu.be/dQw4w9WgXcQ` is also a fine choice |

You might want to move `PROVIDERS_GENERIC_OAUTH_CLIENT_ID`, `PROVIDERS_GENERIC_OAUTH_CLIENT_SECRET`, and `SECRET` to a separate `env_file` with more restrictive permissions, depending on who might be snooping in on your `docker-compose.yml`.

Assuming you've got Traefik running and your environment variables configured correctly, you should be able to `docker-compose up` and then visit `whoami.example.com`.
If you are not already logged into your Mastodon instance, it should redirect you to Mastodon's login page.
After you are logged in, `whoami.example.com` should serve something like this:

```
Hostname: b489d4a064b3
IP: 127.0.0.1
IP: 192.168.80.3
RemoteAddr: 192.168.80.1:56760
GET / HTTP/1.1
Host: whoami.example.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:106.0) Gecko/20100101 Firefox/106.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.5
Cookie: _forward_auth=asdlfkjaslkdfjslakdjflskdaj
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: none
Sec-Fetch-User: ?1
Te: trailers
Upgrade-Insecure-Requests: 1
X-Forwarded-For: 12.34.56.78
X-Forwarded-Host: whoami.example.com
X-Forwarded-Port: 443
X-Forwarded-Proto: https
X-Forwarded-Server: citadel.example.com
X-Forwarded-User: yourusername
X-Real-Ip: 12.34.56.78
```

You're mainly interested in `X-Forwarded-User` - if the value of this matches your Mastodon username, things are working correctly.

If you get an error from Mastodon when trying to log in, make sure that your "Redirect URI" is set correctly in Mastodon, and make sure that your client key and secret are set correctly for `traefik-forward-auth`.
After making changes to either Mastodon or `traefik-forward-auth`'s configuration, you may need to manually log out by visiting `whoami.example.com/_oauth/logout` before the configuration changes actually affect your session.

## Setting up Tiny Tiny RSS

### Running Tiny Tiny RSS

#### The official way

Check out the [official instructions for running Tiny Tiny RSS in Docker Compose](https://git.tt-rss.org/fox/ttrss-docker-compose.git/tree/README.md?h=static-dockerhub).

You'll need to modify the `docker-compose.yml` file to route things through Traefik.
You'll also want to comment out the `ports` declaration while you're there:

```yaml
# ttrss/docker-compose.yml
services:
  ...
  web-nginx:
    image: cthulhoo/ttrss-web-nginx
    restart: unless-stopped
    ## Comment out "ports", to avoid exposing ttrss directly
    # ports:
    #   - ${HTTP_PORT}:80
    volumes:
      - app:/var/www/html:ro
    depends_on:
      - app
    ## Add labels for Traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ttrss.rule=Host(`reader.example.com`)"
      - "traefik.http.services.ttrss.loadbalancer.server.port=80"
```

#### With Awesome TTRSS

Since upstream went all-in on Docker, vanilla Tiny Tiny RSS has gotten a lot easier to run, but I still prefer [Awesome TTRSS](http://ttrss.henry.wang/) (although it's looking for a new maintainer, so I might not prefer it for much longer.)
This is a distribution of Tiny Tiny RSS with some additional plugins included, stuffed into a single container.
A `docker-compose.yml` for Awesome TTRSS can be found [on GitHub](https://github.com/HenryQW/Awesome-TTRSS/blob/main/docker-compose.yml).
Again, you'll need to modify it to route inbound traffic through Traefik:

```yaml
services:
  service.rss:
    image: wangqiru/ttrss:latest
    container_name: ttrss
    ## Comment out "ports", to avoid exposing ttrss directly
    # ports:
    #   - 181:80
    ...
    ## Add labels for Traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ttrss.rule=Host(`reader.example.com`)"
      - "traefik.http.services.ttrss.loadbalancer.server.port=181"
```

While you're in there, you might want to go ahead and comment out `service.opencc`, unless you need to convert your feeds between Traditional and Simplified Chinese.

### Hacking the `auth_remote` plugin

Tiny Tiny RSS includes a plugin called [`auth_remote`](https://dev.tt-rss.org/tt-rss/tt-rss/src/branch/master/plugins/auth_remote/init.php) that _almost_ does what we need.
It can automatically sign a user in, based on the value of an HTTP header.
Unfortunately, the list of headers that it examines is hard-coded, and `X-Forwarded-User` is not in the list, so we're going to have to hack it up a bit.

Find the line where it's iterating through the headers:

```php
# auth_remote/init.php
foreach (["REMOTE_USER", "HTTP_REMOTE_USER", "REDIRECT_REMOTE_USER", "PHP_AUTH_USER"] as $hdr) {
  if (!empty($_SERVER[$hdr])) {
    $try_login = strtolower($_SERVER[$hdr]);
    break;
  }
}
```

...and add `HTTP_X_FOWARDED_USER` to the list:

```php
# auth_remote/init.php
foreach (["HTTP_X_FORWARDED_USER", "REMOTE_USER", "HTTP_REMOTE_USER", "REDIRECT_REMOTE_USER", "PHP_AUTH_USER"] as $hdr) {
  if (!empty($_SERVER[$hdr])) {
    $try_login = strtolower($_SERVER[$hdr]);
    break;
  }
}
```

Eventually I intend to submit this change for inclusion to upstream, but I haven't gotten around to that yet.

I run Tiny Tiny RSS in a container, so I've put my hacked version of `auth_remote` in a separate file, which I then bind on top of the upstream version in my `docker-compose.yml` file:

```yaml
# ttrss/docker-compose.yml
services:
  ...
  web-nginx:
    ...
    volumes:
      ...
      - /path/to/hacked/auth_remote:/var/www/plugins/auth_remote
```

If you're using the [official installation instructions](https://git.tt-rss.org/fox/ttrss-docker-compose.git/tree/README.md?h=static-dockerhub) for Tiny Tiny RSS, you'll need to enable the `auth_remote` plugin using the `TTRSS_PLUGINS` environment variable:

```yaml
# ttrss/docker-compose.yml
services:
  ...
  web-nginx:
    ...
    volumes:
      ...
      - /path/to/hacked/auth_remote:/var/www/plugins/auth_remote
    environment:
      ...
      - TTRSS_PLUGINS=auth_remote
```

If, like me, you're using [Awesome TTRSS](http://ttrss.henry.wang/) instead, then you'll need to use `ENABLE_PLUGINS`:

```yaml
# ttrss/docker-compose.yml
services:
  ...
  service.rss:
    ...
    volumes:
      ...
      - /path/to/hacked/auth_remote:/var/www/plugins/auth_remote
    environment:
      ...
      - ENABLE_PLUGINS=auth_remote
```

### Protecting Tiny Tiny RSS with `traefik-forward-auth`

To get Traefik to send Tiny Tiny RSS's requests over to `traefik-forward-auth` for authorization, we need to tell Traefik to use the middleware that we declared in `traefik-forward-auth`'s `docker-compose.yml`:

```yaml
# ttrss/docker-compose.yml
services:
  ...
  web-nginx:
    ...
    labels:
      ...
      - "traefik.http.routers.ttrss.middlewares=traefik-forward-auth"
```

Now `docker-compose down && docker-compose up` your Tiny Tiny RSS instance.
Visiting `reader.example.com` should now first redirect you to Mastodon if you aren't already logged in, and then automatically sign you into Tiny Tiny RSS under an account matching your Mastodon username.

### Giving your account admin privileges in Tiny Tiny RSS

Unless your Mastodon username is `admin`, you are probably now signed into Tiny Tiny RSS as a normal user.
If you want your account to have administrative privileges, you have two options:

#### Option A: Disable middleware and log in as `admin`

Comment out the `middlewares` line from your `docker-compose.yml` file for Tiny Tiny RSS.
Bring it down, and then bring it back up again.
Log in as your old `admin` account, and grant whatever privileges you want to the account that was created for you when `traefik-forward-auth` automatically signed you in.
Put the `middlewares` line back into your `docker-compose.yml` file for Tiny Tiny RSS, bring it down, and then bring it back up.

#### Option B: Do it with `psql`

Connect to your Tiny Tiny RSS database with `psql`. For me, that looks something like:

```
# docker-compose exec database.postgres psql -U postgres
psql (15.0 (Debian 15.0-1.pgdg110+1))
Type "help" for help.

postgres=#
```

Your mileage may vary depending on your configuration.
After you've gotten a `psql` prompt, run the following command:

```sql
update ttrss_users set access_level = 10 where login = 'yourusername';
```

### Making the Tiny Tiny RSS API work again

By default, `traefik-forward-auth` will interpose itself between ALL requests to Tiny Tiny RSS.
That's fine if you're only using it in your browser, and if you're never sharing anything with anybody.
If you want to use a mobile client, though, or if you want to share some of your groups of feeds or your starred items with the outside world, then this is trouble.
Mobile clients for Tiny Tiny RSS know nothing of the authentication scheme we've just set up, and neither do feed readers.
We need to exclude the endpoints used by these features from `traefik-forward-auth` if we want them to function correctly.

`traefik-forward-auth` supports this via "rules" that can be specified on the command-line.
Handily, the [syntax for matching requests](https://doc.traefik.io/traefik/routing/routers/#rule) is the same as Traefik uses; `traefik-forward-auth` actually uses Traefik's rule parser directly (and it was a huge pain in the ass to keep this working when I updated all the dependencies, you're welcome.)

Tiny Tiny RSS keeps its API routes at `/api`; sharing things publicly goes through `/public.php`.
Add a couple of rules to your `docker-compose.yml` for `traefik-forward-auth` to exclude these endpoints from authentication:

```yaml
# trafik-forward-auth/docker-compose.yml
services:
  traefik-forward-auth:
    image: ghcr.io/jordemort/traefik-forward-auth:latest
    command:
      - --rule.ttrss-public.action=allow
      - --rule.ttrss-public.rule=Host(`reader.example.com`) && Path(`/public.php`)
      - --rule.ttrss-api.action=allow
      - --rule.ttrss-api.rule=Host(`reader.example.com`) && PathPrefix(`/api/`)
      - --rule.local.action=allow
    ...
```

Bring `traefik-forward-auth` down, bring it back up, and now requests to `reader.example.com/api/` and `reader.example.com/public.php` should bypass authentication.

**NOTE:** This still doesn't make the API aware of the OAuth2 authentication scheme.
If you want to use a mobile app with Tiny Tiny RSS, you're going to have to create an "app password" in its preferences to use with the mobile app.
Your Mastodon password won't work.

## Setting up RSS Bridge

### Running RSS Bridge

There's an official image for RSS Bridge on Docker Hub at [rssbridge/rss-bridge](https://hub.docker.com/r/rssbridge/rss-bridge).
Here's an `docker-compose.yml` for it:

```yaml
# rssbridge/docker-compose.yml
services:
  rssbridge:
    image: docker.io/rssbridge/rss-bridge:latest
    container_name: rssbridge
    restart: unless-stopped
    volumes:
      # custom config bound into container
      - ./config/config.ini.php:/app/config.ini.php:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.tfa-rssbridge.rule=Host(`rssbridge.example.com`)"
      - "traefik.http.services.tfa-rssbridge.loadbalancer.server.port=80"
      - "traefik.http.routers.tfa-rssbridge.middlewares=traefik-forward-auth"
```

RSS Bridge is configured using a `config.ini.php` file.
Download a copy of [the default configuration](https://github.com/RSS-Bridge/rss-bridge/blob/master/config.default.ini.php) and modify it to your taste, and then bind it into the container.
Make sure `enable` is set to `false` under `[authentication]` - we want to outsource authentication to `traefik-forward-auth` instead.

Bring RSS Bridge up, and you should be able to view it at `rssbridge.example.com`, after logging into Mastodon.

### Bypass authentication for requests from other containers

With `traefik-forward-auth` in front of it, RSS Bridge works, but it's not terribly useful.
You can log into it with your browser, but Tiny Tiny RSS doesn't know how to do that, so you won't be able to read any of the feeds you generate with it.

In order to fix this, we need to add some additional rules to `traefik-forward-auth`:

```yaml
# trafik-forward-auth/docker-compose.yml
services:
  traefik-forward-auth:
    image: ghcr.io/jordemort/traefik-forward-auth:latest
    command:
      ...
      - --rule.rssbridge-docker.action=allow
      - --rule.rssbridge-docker.rule=Host(`rssbridge.example.com`) && HeadersRegexp(`X-Forwarded-For`, `(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)`)
```

This tells `traefik-foward-auth` to permit requests to `rssbridge.example.com` that have an `X-Forwarded-For` header that matches a big, ugly, regular expression.

`X-Forwarded-For` is injected into the HTTP request by Traefik, and contains the IP address that originated the request.
The regular expression is intended to match IP addresses in the 172.16.0.0/12 network.
At least on my servers, all of the internal networks that Docker creates for containers fall within this range.
Thus, the rule bypasses authentication for any requests coming from another container on the same host.

Traefik has a `ClientIP` matcher, but I couldn't get that to work.
I didn't debug it thoroughly, but I suspect that from `traefik-forward-auth`'s perspective, `ClientIP` matches against the IP that Traefik is using to connect to it, not the IP that the client is using to connect to Traefik.

Bring RSS Bridge down, bring it back up, and now your Tiny Tiny RSS instance should be able to retrieve feeds from it without authentication.

## That's all, folks

![Jake Blues: What kind of federated media do you usually have here? Bartender: Oh we've got both kinds, RSS and ActivityPub](/images/single-sign-on-with-mastodon/both-kinds.jpg "Jake Blues: What kind of federated media do you usually have here? Bartender: Oh we've got both kinds, RSS and ActivityPub")

I think an RSS reader makes a very nice complement to Mastodon.
You can also generalize this approach.
If you have a web application that can log a user in based on the `X-Forwarded-User`, or if you have an application that has no concept of users that you just want to protect from the general public, `traefik-forward-auth` gives you a not-too-difficult way to gate access to that application behind a Mastodon login.

### Plug

Friendly reminder that I do freelancing!
Did you read this and think "I wish that guy could work for me?"
I can, and will, if the price is right!
If you think there's something I can help you with, [send me an email](mailto:jordan@jordemort.dev) and let's talk about it!
