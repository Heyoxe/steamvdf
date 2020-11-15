# SteamVDF

A packages that allows you to parse binarized VDF files into readable JSONs.

## Installation

### NPM

`npm install steamvdf`

## Usage

### Typescript

```ts
import { Vdf } from 'steamvdf';
import { readFileSync } from "fs";

const buffer = readFileSync('path/to/appinfo.vdf');
const vdf = new Vdf(buffer);
```

### Javascript

```js
const steamvdf = require("steamvdf");
const fs = require("fs");

const buffer = fs.readFileSync('path/to/appinfo.vdf');
const vdf = new steamvdf.Vdf(buffer);
```
