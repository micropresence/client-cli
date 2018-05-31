#!/usr/bin/env node

import Pino from "pino";
import * as yargs from "yargs";

import {clientRegistration} from "@micropresence/protocol";
import {TargetClient} from "./TargetClient";

interface Args extends yargs.Arguments {
    redirect: string;
    target: string;
    broker: string;
}

const argv = yargs
    .usage("Usage: $0 -r [hostname] -t [hostname]")
    .option("redirect", {alias: "r"})
    .option("target", {alias: "t"})
    .option("broker", {alias: "b", default: "localhost:3000"})
    .demandOption(["redirect", "target"]).argv as Args;

async function main(args: Args) {
    const targetClient = new TargetClient(
        {
            redirectHost: args.redirect,
            targetHost: args.target,
            server: `ws://${args.broker}`
        },
        Pino({level: "debug"})
    );
    const response = await targetClient.register();
    if ((response as clientRegistration.Ok).authToken) {
        console.log(`AuthToken: ${(response as clientRegistration.Ok).authToken}`);
    } else {
        console.error(response);
    }
}

main(argv);
