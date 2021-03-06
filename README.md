![Monsoon logo](https://raw.githubusercontent.com/monsoon-load-testing/monsoon-load-testing.github.io/main/assets/images/monsoon_logo_color.png)

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/monsoon-load-testing.svg)](https://www.npmjs.com/package/monsoon-load-testing)
[![Downloads/week](https://img.shields.io/npm/dw/monsoon-load-testing.svg)](https://npmjs.org/package/monsoon)
[![License](https://img.shields.io/npm/l/monsoon-load-testing.svg)](https://github.com/minhphanhvu/monsoon/blob/master/package.json)

<!-- toc -->

- [monsoon](#monsoon)
- [Usage](#usage)
- [Getting Started](#getting-started)
- [FAQ](#faq)
- [Commands](#commands)
- [Scripting](#scripting)
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

- an [AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html?nc2=h_ct&src=default&tag=soumet-20)
- `npm` is [installed](https://www.npmjs.com/get-npm)
- the AWS CLI is [installed](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html?tag=soumet-20) and configured
- an [AWS named profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
- the AWS CDK command-line tool is [installed](https://docs.aws.amazon.com/cdk/latest/guide/cli.html?tag=soumet-20)

### Installation

- run `npm install -g monsoon-load-testing`
- type `monsoon --help` to see all the available commands

### First Time Usage

The `monsoon` command is run by inputting subcommands after the initial `monsoon` command, e.g. `monsoon <subcommand>`.

To read the help text for each command, type `monsoon <command> --help`. This outputs a short explanation of what the command does and how to use it.

- `cd` to the folder in which you would like to initialize your Monsoon directory

- type `monsoon init`. You will be prompted for your AWS credentials, including the name of your CLI profile. A new `monsoon_tests` subdirectory will be created inside your current working directory. You will need to `cd` into `monsoon_tests` and be sure to execute all of the other `monsoon` CLI subcommands from `monsoon_tests`.

- Your Monsoon infrastructure information can be found in `~/.monsoon/.env`:

  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_KEY
  - AWS_PROFILE

- type `monsoon config` if you need to edit your AWS credentials.

- Once inside `monsoon_tests`, type `monsoon new-test` to create a new test folder that will include a `test_script.js` template and a default `test_config.json` file that you can update to set the parameters for your current test.

- type `monsoon list` to see all current test directories.

- type `monsoon deploy` to deploy the infrastructure.

- `monsoon start` will prompt you to select the test directory that contains the test you want Monsoon to run.

- type `monsoon weather-channel` to start the local server that serves the results dashboard. To view this dashboard, visit localhost:5000.

### Removing Monsoon

To remove your Monsoon infrastructure from AWS, run `monsoon teardown`.

To remove the Monsoon global directory, run `monsoon destroy`. Be sure to run `monsoon teardown` first -- otherwise the `monsoon teardown` command cannot use your AWS credentials to tear down the infrastructure.

To uninstall / remove the Monsoon CLI tool, run `npm uninstall -g monsoon-load-testing`.

<!-- gettingstartedstop -->

# FAQ

<!-- faq -->

### I quit `monsoon deploy` in the middle of deploying the infrastructure -- is there a way to tear down the infrastructure?

- AWS will continue to set up your infrastructure even if you interrupt the Monsoon CLI command. You'll need to manually tear it down by visiting the he [AWS console](https://aws.amazon.com/console?tag=soumet-20), navigating to the CloudFormation section and deleting the `monsoon` stack. Note that the infrastructure deployment must be completed _before_ AWS will allow you to delete the stack.

### I ran `monsoon destroy` and now cannot run `monsoon teardown` -- is there a way to tear down the infrastructure?

- `monsoon destory` deletes your Monsoon `.env` file. Make sure to run `monsoon config` again with correct information, then you can run `monsoon teardown`.

<!-- faqstop -->

# Commands

<!-- commands -->

- [`monsoon config`](#monsoon-config)
- [`monsoon deploy`](#monsoon-deploy)
- [`monsoon destroy`](#monsoon-destroy)
- [`monsoon help [COMMAND]`](#monsoon-help-command)
- [`monsoon init`](#monsoon-init)
- [`monsoon list`](#monsoon-list)
- [`monsoon new-test`](#monsoon-new-test)
- [`monsoon start`](#monsoon-start)
- [`monsoon teardown`](#monsoon-teardown)
- [`monsoon weather-channel`](#monsoon-weather-channel)

## `monsoon config`

Update AWS credentials

```
USAGE
  $ monsoon config

DESCRIPTION

  Allows you to change the AWS credentials associated with your Monsoon infrastructure

  You will need:
     - your AWS access key
     - your AWS secret key
     - your AWS profile name
```

_See code: [src/commands/config.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/config.ts)_

## `monsoon deploy`

Deploys Monsoon infrastructure inside your AWS account

```
USAGE
  $ monsoon deploy
```

_See code: [src/commands/deploy.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/deploy.ts)_

## `monsoon destroy`

Deletes the `.monsoon` directory from the user's local machine

```
USAGE
  $ monsoon destroy
```

_See code: [src/commands/destroy.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/destroy.ts)_

## `monsoon help [COMMAND]`

Displays help for monsoon

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

Creates global .monsoon directory and .env file

```
USAGE
  $ monsoon init

DESCRIPTION
  Creates the Monsoon directory at ~/.monsoon.
  The .env file inside contains your AWS credentials and AWS profile name Monsoon needs to interact with your infrastructure.
```

_See code: [src/commands/init.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/init.ts)_

## `monsoon list`

Lists all current test directories in the `monsoon_tests` folder

```
USAGE
  $ monsoon list
```

_See code: [src/commands/list.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/list.ts)_

## `monsoon new-test`

Creates a new test directory pre-populated with a template test script and a `test_config.json` file

```
USAGE
  $ monsoon new-test
```

To see an example of a test script refer to the Scripting section.

_See code: [src/commands/new-test.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/new-test.js)_

## `monsoon start`

Starts the load test

```
USAGE
  $ monsoon start

DESCRIPTION
  Allows you to choose the directory containing the test script you want to run and begins running that test.
```

_See code: [src/commands/start.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/start.ts)_

## `monsoon teardown`

Tears down your AWS infrastructure

```
USAGE
  $ monsoon teardown

DESCRIPTION
  This command should be run BEFORE running the "monsoon destroy" command
```

_See code: [src/commands/teardown.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/teardown.ts)_

## `monsoon weather-channel`

Displays your test results dashboard on localhost:5000

```
USAGE
  $ monsoon weather-channel

DESCRIPTION
  Starts a local server that serves the test results dashboard. To view this dashboard, visit localhost:5000 in your browser.
```

_See code: [src/commands/weather-channel.ts](https://github.com/monsoon-load-testing/monsoon/blob/v1.1.7/src/commands/weather-channel.ts)_

<!-- commandsstop -->

# Scripting

Monsoon users can write their test with the npm library `monsoon-weather-station`. Weather Station makes use of methods from the Performance API built into browsers and gives engineers a way to write code to measure how long individual user actions take.

Monsoon users can use the method `measure` to define the actions of their test.
```typescript
await weatherStation.measure(actionName, script, delay?)
```

`actionName` (string): The name you want to give to the action.

`script` (callback): The Puppeteer script that defines the action.

`delay` (number || array): Specifies the time (in milliseconds) to wait after the execution of the action. The delay can be a fixed value (e.g. 1500) or an interval to generate random delays (e.g. [1000, 3000]).

For example, let's say we wanted to load test the following workflow for a ecommerce web app:

1. Go to the Boost Health Main Page
2. View the Brain Boost product details
3. Add Brain Boost to the cart

The script would look like this:

```javascript
const puppeteer = require("puppeteer");
const WeatherStation = require("monsoon-weather-station");

async function testScript(browser, page, userId) {
  const weatherStation = new WeatherStation(browser, page, userId);
  await weatherStation.measure(
    "1) Go to Boost Health Main Page", // actionName
    async () => {
      await page.goto("https://boosthealth.com"); // Puppeteer script
    },
    [1000, 3000] // delay interval
  );
  await weatherStation.measure(
    "2) View Brain Boost product details",
    async () => {
      await Promise.all([
        page.waitForNavigation(),
        page.click("#brain-boost-button"),
      ]);
    },
    2000 // fixed delay of 2000 ms
  );
  await weatherStation.measure(
    "3) Add Brain Boost to Cart",
    async () => {
      await Promise.all([
        page.waitForNavigation(),
        page.click("button .submit"),
      ]);
    },
    [1000, 3000]
  );
}
```
