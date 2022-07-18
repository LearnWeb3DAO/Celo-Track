# Celo Consensus Deep Dive

We have a high level idea of what Celo is, let's try to take a deeper dive into how Celo is built, what happens 'under the hood', and Celo's relationship with Ethereum (and other EVM chains).

Celo's blockchain implementation, the 'official' one developed by the Celo team, is based on `go-ethereum`. Additional components specific to Celo, such as stablecoins for gas payment, are built using smart contracts while features like phone number verification for the identity service are handled off-chain within the blockchain node.

## Byzantine Generals' Problem
![](https://i.imgur.com/zB8j69T.png)

The Byzantine Generals' Problem was conceived in 1982 as a logical dilemma. While it may seem a bit random, this problem plays a huge role in the design of every single blockchain system.

The problem goes as follows. There are multiple generals, each with their own army, who are situated in different locations around an enemy city they want to attack.

The generals need to somehow agree on whether they should attack or retreat. What they choose is irrelevant, but it's important they reach consensus and they all do the same thing. If they all choose to attack, they will gain victory. If they all retreat, they can come back another day. But if some attack and others retreat, they will be defeated and lose a lot of people.

The requirements for this scenario are the following:
- Each general must decide whether to attack or retreat
- After the decision is made, it cannot be changed
- All generals must agree on the same decision and execute it in a coordinated manner

The problem, however, is that one general can only communicate with another through messengers carrying messages. Since they are far away from each other, it is possible for messages to get delayed, destroyed, or lost. A soldier might be caught, murdered, or intentionally be malicious while delivering the message.

![](https://i.imgur.com/ZyJ7p1s.png)

In addition, even if messages are successfully delivered, some generals might be malicious themselves and send a fraudulent message to other generals, leading to total defeat.

In the context of blockchains, this problem is highly important. You can think of each general as a node on the network, and the nodes need to reach consensus on the state of the system. But, it is possible for the communication channel between these nodes to break down, or some nodes may choose to intentionally act maliciously. 

As it turns out, no solution to this problem exists if less than or equal to 2/3 of the generals are loyal. The proof for this can be solved using some graph theory and mathematics. There are optional readings at the end of this level if you want to dig deeper into the math behind this.

<Quiz questionId="214b91ed-c2a1-4cf8-a2af-550029bbeb1e" />

## Byzantine Fault Tolerance
Byzantine Fault Tolerance (BFT) is the property of a system that is able to resist the failures that can be derived from the Byzantine Generals' Problem i.e. it can continue operating even if some nodes fail or act maliciously.

Every consensus algorithm in blockchains needs to solve for BFT in some way or the other. Now that we have this context, we can move on.

<Quiz questionId="c248857e-c8f5-47f1-8cba-ce71716da823" />

## Consensus Algorithm
Celo uses a modified version of Istanbul BFT (IBFT), a Byzantine Fault Tolerant consensus algorithm. IBFT was proposed as an extension to `go-ethereum` but was not merged into the main Ethereum network. Variants of IBFT also exist in other EVM chains, such as Quorum, a private/permissioned EVM blockchain for enterprise.

Celo's consensus algorithm includes validators, who are selected periodically to build a validator set. Approximately once every day, the active validator set is updated using the Proof of Stake process. This period of time is called the **epoch**. The active validator set is responsible for running Celo's consensus protocol. Note: there is a max cap on how many validators can be part of the active validator set, which is currently set to 110. This number can be changed through Celo's on-chain governance contracts by creating a proposal.

## Validator Elections
Celo distinguishes between the types of validators, categorizing them within **active validators** and **registered validators**. Active validators are those who have been elected to run the consensus protocol for the current epoch. Registered validators are those who can participate, but are not currently part of the active validator set.

The Proof of Stake mechanism in Celo determines which nodes become active validators at the end of every epoch. The very first set of active validators were determined in the genesis block. At the end of every epoch, an election is run that can lead to the active validator set changing, by adding or removing validators from the set.

However, it is hard for the numerous CELO holders to keep track of, and vote fairly, in validator elections every day. To solve for this, Celo introduces the concept of **validator groups**. 

A validator group is literally a group of validators. There can be no more than 5 validators per group. The purpose is to help mitigate information disparity between voters and validators by instead associating reputation and identity with a group instead. Since every validator must be part of a group to stand for the election, the group is in charge of ensuring they choose reputable validators. If validators in a certain group behave maliciously, the group's reputation goes down, and voters can move on to voting for another group entirely. Validator groups are compensated by taking a share of the rewards earned by validators within their group.

Additionally, votes persist through epochs. So unless a voter goes out and changes their vote, they will automatically keep voting for the same validator group as in the last epoch.

<Quiz questionId="4f0cfe8f-903a-4b79-93c3-c34a99b1505b" />
<Quiz questionId="8a06f6fc-5621-4591-b1fe-3b8442148620" />

## Locked CELO and Voting
To participate in validator elections, either as a validator or as a voter, users must first stake their CELO to the `LockedGold` smart contract.

> Note: The native token of Celo used to be called Celo Gold (cGLD), but is now called just CELO. As such, some things within Celo still refer to the old name, such as the `LockedGold` smart contract.

Locked CELO has multiple uses. It guarauntees the same tokens are not used for voting more than once in an election. The same Locked CELO can also be used for voting on governance proposals, and also provide staking rewards to the users.

After staking, there is an unlocking period of 3 days to retrieve your CELO back after making a request to retrieve it. This deters attackers from borrowing large amounts of money to vote maliciously in an election and then withdrawing the CELO back, as by the time they get it back, the attack would have presumably been detected and the value of the token fallen thereby causing them to lose money. 

## Epoch Rewards
Similar to how Ethereum has block rewards, Celo has Epoch Rewards, used for minting and distributing new units of CELO as blocks are produced.

Epoch Rewards are paid at the end of every epoch (i.e. after multiple blocks) instead of at every block for block rewards in Ethereum. They are used to reward users for various things:
- Rewards for validators and validator groups
- Rewards for users who locked their CELO to participate in validator elections voting
- Build up a community fund for protocol development and infrastructure grants
- Keep the stablecoin reserve in check
- Purchase carbon credits to keep Celo carbon neutral

The CELO token has a fixed supply, and over time a total of 400 million CELO will be released for epoch rewards. In the long term, it will exhibit deflationary characteristics like Bitcoin.

## Validator Slashing
Slashing is the process of punishing misbehaving or malicious validators by seizing a portion of their stake. There are two types of conditions under which a validator may be slashed:

1. Provable Slashing
2. Governed Slashing

**Provable Slashing** conditions are those where information provided by an off-chain external source can be verified on-chain, which can lead to a validator being slashed. In exchange for providing such information, the reporter receives a reward - a portion of the slashed amount. The remainder of the slashed amount if sent to Celo's community fund.

Examples of provable slashing include things like persistent downtime by a validator, where an active validator was absent persistently, in which case they will be slashed 100 CELO. Alternatively, if a validator was proven to have performed double signing i.e produced two different blocks in the same consensus round but with differing hashes, the validator will be slashed 9000 CELO. In both cases, the validator's future rewards will also be suppressed, and they will be ejected from their current validator group.

**Governed Slashing** conditions are those where misbehaviour is hard to formally define and verify on-chain, and requires off-chain knowledge along with discussion on a governance proposal. Slashing can then be performed via governance proposals. This type of slashing is important for preventing advanced validator attacks.

<Quiz questionId="aeba473c-0900-420a-83a2-091cd668f988" />

## Readings
These are optional readings if you want to dig even deeper:
- [Byzantine Generals Problem](https://lamport.azurewebsites.net/pubs/byz.pdf)
- [Celo's Proof of Stake](https://docs.celo.org/celo-codebase/protocol/proof-of-stake)


## References
- [Byzantine Generals' Problem Image](https://academy.moralis.io/wp-content/uploads/2021/06/maxresdefault-2-1.jpg)

<SubmitQuiz />