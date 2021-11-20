# monsoon

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/monsoon.svg)](https://npmjs.org/package/monsoon)
[![Downloads/week](https://img.shields.io/npm/dw/monsoon.svg)](https://npmjs.org/package/monsoon)
[![License](https://img.shields.io/npm/l/monsoon.svg)](https://github.com/minhphanhvu/monsoon/blob/master/package.json)

<!-- toc -->
* [monsoon](#monsoon)
* [Usage](#usage)
* [Getting Started](#getting-started)
* [FAQ](#faq)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g monsoon-load-testing
$ monsoon COMMAND
running command...
$ monsoon (-v|--version|version)
monsoon-load-testing/1.1.7 darwin-arm64 node-v16.13.0
$ monsoon --help [COMMAND]
USAGE
  $ monsoon COMMAND
...
```
<!-- usagestop -->

# Getting Started

<!-- gettingstarted -->

### Prerequisites

- [an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html?nc2=h_ct&src=default&tag=soumet-20)
- `npm` is [installed](https://www.npmjs.com/get-npm)
- the AWS CLI is [installed](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html?tag=soumet-20) and configured
- an [AWS named profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
- the AWS CDK command-line tool is [installed](https://docs.aws.amazon.com/cdk/latest/guide/cli.html?tag=soumet-20)

### Installation

- run `npm install -g monsoon-load-testing` (to install [TODO: UPDATE NPM PACKAGE LINK])
- type `monsoon --help` to see all the available commands

### First Time Usage

The `monsoon` command is run by inputting subcommands after the initial `monsoon` command, e.g. `monsoon <subcommand>`.

To read the help text for each command, type `monsoon <command> --help`. This will output a short explanation of what the command does and how to use it.

- `cd` to the folder in which you would like to initialize your Monsoon directory

- type `monsoon init`. You will be prompted for your AWS credentials, including the name of your CLI profile. A new `monsoon_tests` subdirectory will be created inside your current working directory. You will need to `cd` into `monsoon_tests` and be sure to execute all of the other `monsoon` CLI subcommands from `monsoon_tests`.

- Your Monsoon infrastructure information can be found in `~/.monsoon/.env`:

  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_KEY
  - AWS_PROFILE

- type `monsoon config` if you need to edit AWS credentials for `Monsoon`.

- Once inside `monsoon_tests`, type `monsoon new-test` to create a new test folder that will include a `test_script.js` template and a default `test_config.json` file that you can update to set the parameters for your current test.

- type `monsoon list` to see all current test directories.

- type `monsoon deploy` to deploy the infrastructure.

- `monsoon start` will prompt you to select the test directory that contains the test you want `Monsoon` to run.

- type `monsoon weather-channel` to start the local server that serves the results dashboard. To view this dashboard, visit localhost:5000.

### Removing Monsoon

To remove `Monsoon` infrastructure from AWS, run `monsoon teardown`.

To remove `Monsoon` global directory, run `monsoon destroy`. Be sure to run `monsoon teardown` first or else the `monsoon teardown` cannot use your AWS credentials to tear down the infrastructure.

To uninstall / remove the `Monsoon` cli tool, run `npm uninstall -g monsoon-load-testing`.

<!-- gettingstartedstop -->

# FAQ

<!-- faq -->

### I quit `monsoon deploy` in the middle of deploying the infrastructure -- is there a way to tear down the infrastructure?

- To remove this infrastructure (that AWS will continue to set up even if you interrupt the Monsoon cli command, visit the [AWS console](https://aws.amazon.com/console?tag=soumet-20), navigate to the CloudFormation section and you can individually delete the `monsoon` stack. Note that the infrastructure deployment must be completed _before_ AWS will allow you to delete the stack.

### I ran `monsoon destroy` and now cannot run `monsoon teardown` -- is there a way to tear down the infrastructure?

- `monsoon destory` deletes your Monsoon `.env` file. Make sure to run `monsoon config` again with correct information, then you can run `monsoon teardown`.

<!-- faqstop -->

# Commands

<!-- commands -->
* [`monsoon config`](#monsoon-config)
* [`monsoon deploy`](#monsoon-deploy)
* [`monsoon destroy`](#monsoon-destroy)
* [`monsoon help [COMMAND]`](#monsoon-help-command)
* [`monsoon init`](#monsoon-init)
* [`monsoon list`](#monsoon-list)
* [`monsoon new-test`](#monsoon-new-test)
* [`monsoon start`](#monsoon-start)
* [`monsoon teardown`](#monsoon-teardown)
* [`monsoon weather-channel`](#monsoon-weather-channel)

## `monsoon config`

Update AWS credentials

```
USAGE
  $ monsoon config

DESCRIPTION
  ...
  If you want to change your AWS credentials for Monsoon infrastructure.

  You will need:
     - your AWS access key
     - your AWS secret key
     - your AWS profile name
```

_See code: [src/commands/config.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/config.ts)_

## `monsoon deploy`

Deploy the infrastructure on your AWS account

```
USAGE
  $ monsoon deploy

DESCRIPTION
  ---
```

_See code: [src/commands/deploy.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/deploy.ts)_

## `monsoon destroy`

Delete the .monsoon directory from the user's local machine

```
USAGE
  $ monsoon destroy

DESCRIPTION
  ---
```

_See code: [src/commands/destroy.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/destroy.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.5/src/commands/help.ts)_

## `monsoon init`

This is init command description

```
USAGE
  $ monsoon init
```

_See code: [src/commands/init.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/init.ts)_

## `monsoon list`

This is list command.

```
USAGE
  $ monsoon list
```

_See code: [src/commands/list.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/list.ts)_

## `monsoon new-test`

This is new-test command.

```
USAGE
  $ monsoon new-test
```

_See code: [src/commands/new-test.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/new-test.ts)_

## `monsoon start`

This is start command.

```
USAGE
  $ monsoon start
```

_See code: [src/commands/start.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/start.ts)_

## `monsoon teardown`

This is teardown command

```
USAGE
  $ monsoon teardown
```

_See code: [src/commands/teardown.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/teardown.ts)_

## `monsoon weather-channel`

This is list command.

```
USAGE
  $ monsoon weather-channel
```

_See code: [src/commands/weather-channel.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/weather-channel.ts)_
<!-- commandsstop -->
