# Blockchain Setup Guide

## Step 1 — Install and compile contracts
cd blockchain
npm install
npx hardhat compile

## Step 2 — Deploy to Polygon Amoy Testnet
# Get free MATIC from https://faucet.polygon.technology
cp .env.example .env
# Fill in PRIVATE_KEY and POLYGON_AMOY_RPC_URL
npx hardhat run scripts/deploy.js --network amoy

## Step 3 — Copy deployed addresses
# deploy.js auto-saves to blockchain/deployed_addresses.json
# This file is read by Django's PolygonERPService

## Step 4 — Enable in Django
BLOCKCHAIN_ENABLED=true in .env

## Step 5 — Verify on Polygonscan
npx hardhat run scripts/verify.js --network amoy

## Contract Addresses (fill after deploy)
ERPLedger: [paste here]
StockVerifier: [paste here]
Polygonscan: https://amoy.polygonscan.com/address/[paste here]
