# What is Celo?

![](https://i.imgur.com/hteAbzk.png)

6.6 billion people, or roughly 83% of the worlds population, have access to mobile phones. With web3 on it's way to becoming mainstream, future developers will need a way to easily create applications that integrate key features such as being able to send payments to someone's phone number, receiving payments before an account is created by the recipient, etc. 

Celo is a Proof of Stake Layer-1 EVM compatible blockchain, optimized for DeFi, which is designed to be mobile-first and climate friendly. With it's mobile-first design, it aims to bring the benefits of DeFi to the 6 billion+ market of smartphones in the world.

Being fully EVM compatible, developers can port their Solidity dApps to Celo easily, just by changing the RPC URL during deployment. 

Celo also uses an ultralight client, which utilizes Zero-Knowledge proofs, to allow for syncing with the Celo blockchain extremely fast. The ZKP allows for quick verification of the chain syncing computation, without having to sync the entire chain locally.

The Celo Blockchain and Celo Core Contracts (a set of smart contracts deployed by the Celo team) form together the **Celo Protocol**. Let's take a deeper look at what that implies.

<Quiz questionId="b83cfe70-0908-429b-bca1-3dad336d0de5" />
<Quiz questionId="7828b315-ab7c-4d60-8cce-bb31a9f555f9" />

## Celo Protocol

### Consensus Algorithm
Celo uses a Proof of Stake consensus algorithm, which allows for cheap and fast transactions on the network. It is fault-tolerant upto 66%, i.e. it can handle upto 1/3rd of the network validators being malicious.

Anyone can stake their CELO tokens and earn rewards by participating in validator elections and governance proposals. Validators also earn additional rewards in Celo Dollars (cUSD).

<Quiz questionId="14ae17e1-8aee-4b6a-81a5-794c9175c0ee" />

### Stable Cryptocurrencies
Celo provides native support for a family of stablecoins that track the value of fiat currencies. Currently, it supports the Celo Dollar (cUSD) and the Celo Euro (cEUR).

The CELO token, and other assets like BTC and ETH, serve as collateral for these stablecoins. These stablecoins can easily be traded for the CELO token through Celo's own reserve contracts that allow users to mint new cUSD and cEUR by sending CELO to the contract, or to burn cUSD and cEUR to redeem CELO tokens.

But, the interesting part comes from the fact that on the Celo blockchain, you can pay gas fees in these stablecoins. A user can perform any transaction and pay for gas with cUSD or cEUR, without needing to hold any CELO tokens in their wallet for gas.

<Quiz questionId="104359af-0a2f-43a8-934c-698ca39abf47" />
<Quiz questionId="130ccc2c-3db4-4ffa-bbd8-eb6c8fea16fa" />
<Quiz questionId="dda61c95-b9ef-40f4-bf61-5d02392fd12e" />

### On-Chain Governance
Unlike Ethereum, where on-chain upgrades happen through forking and community consensus on which fork to follow, Celo uses an on-chain governance mechanism for aspects of the protocol that reside in the Celo Core Contracts and for a number of parameters used by the Celo blockchain.

This includes things like upgrading the core smart contracts, adding new stablecoins, changing how validators are elected, etc.

Proposals in the governance contract are selected and voted on by CELO token holders, and the governance contract can execute the relevant code if the proposal passes.

<Quiz questionId="b840d45e-ce27-4b53-aa76-553f41795916" />

### Mobile-first Identity Layer
Celo offers a lightweight identity layer that allows users to identify and securely transact with other users via their phone numbers. Celo Wallet enables payments directly to users listed in the devices' contact list.

A user can request to link their phone number to their address through the Attestations contract. The contract uses a decentralized source of randomness through Oracles to pick a few validators who produce and send signed secret messages over SMS. The user then submits these back to the Attestations contract, and if successfully verified, adds a mapping from the phone number to the user's account.

<Quiz questionId="c32f430a-d429-47e8-8869-ed62bc214bab" />

### Rich Transactions
Compared to Ethereum, Celo provides a few advantages in how it deals with transactions.

Firstly, the CELO token, while being the native token of the Celo blockchain, is also an ERC-20 token. This means no more wrapped assets! No more WETH like on Ethereum, because ETH does not behave as an ERC-20 token. This simplifies the life of application developers.

Secondly, as mentioned before, transaction fees on Celo can be paid using the stablecoins. 

Thirdly, an Escrow contract allows users to send payments to phone numbers who don't yet have an account on the Celo blockchain. Payments are sent to the Escrow contract, and can be withdrawn by the intended recipient after they create an account and link their phone number to their address.

All these features allow for an easier on-ramp to Celo and also makes life easier for application developers.

<SubmitQuiz />
