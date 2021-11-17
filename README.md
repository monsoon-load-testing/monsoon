# monsoon

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/monsoon.svg)](https://npmjs.org/package/monsoon)
[![Downloads/week](https://img.shields.io/npm/dw/monsoon.svg)](https://npmjs.org/package/monsoon)
[![License](https://img.shields.io/npm/l/monsoon.svg)](https://github.com/minhphanhvu/monsoon/blob/master/package.json)

<!-- toc -->
* [monsoon](#monsoon)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g monsoon-load-testing
$ monsoon COMMAND
running command...
$ monsoon (-v|--version|version)
monsoon-load-testing/1.0.0 linux-x64 node-v16.3.0
$ monsoon --help [COMMAND]
USAGE
  $ monsoon COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`monsoon deploy`](#monsoon-deploy)
* [`monsoon destroy`](#monsoon-destroy)
* [`monsoon hello`](#monsoon-hello)
* [`monsoon help [COMMAND]`](#monsoon-help-command)
* [`monsoon init`](#monsoon-init)
* [`monsoon teardown`](#monsoon-teardown)

## `monsoon deploy`

This is deploy command

```
USAGE
  $ monsoon deploy
```

_See code: [src/commands/deploy.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.0.0/src/commands/deploy.ts)_

## `monsoon destroy`

Deletes the .monsoon directory from the user's local machine

```
USAGE
  $ monsoon destroy
```

_See code: [src/commands/destroy.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.0.0/src/commands/destroy.ts)_

## `monsoon hello`

Describe the command here

```
USAGE
  $ monsoon hello

OPTIONS
  -n, --name=name  name to print

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/hello.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.0.0/src/commands/hello.ts)_

## `monsoon help [COMMAND]`

display help for monsoon

```
USAGE
  $ monsoon help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.4/src/commands/help.ts)_

## `monsoon init`

This is init command description

```
USAGE
  $ monsoon init
```

_See code: [src/commands/init.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.0.0/src/commands/init.ts)_

## `monsoon teardown`

This is teardown command

```
USAGE
  $ monsoon teardown
```

_See code: [src/commands/teardown.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.0.0/src/commands/teardown.ts)_
<!-- commandsstop -->
