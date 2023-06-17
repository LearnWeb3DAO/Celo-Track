# Ship a _true_ NFT Marketplace on Celo - Part 1

![](https://i.imgur.com/r4275Ro.jpg)

We've all heard of OpenSea, and maybe even of other marketplaces such as LooksRare. These platforms allow users to buy and sell all sorts of NFTs on their platforms, bringing a decentralized market to these digital mediums.

In this level, we will be building **OUR OWN** NFT marketplace, similar to OpenSea, completely from scratch on Celo!

We will use a bunch of developer tools to make this possible, and this is going to be an amazing level!

- Hardhat
- NextJS (React)
- Celo
- The Graph
- Rainbowkit
- Wagmi
- Ethers.js
- Metamask / Alfajores Wallet

This level will also help solidify your understanding of **events** on the blockchain, as once we get around to building the frontend, indexing events through The Graph will become extremely important.

For developers who are new to the Wagmi space, things might get a bit tough, but bear with us. After this course, you will be pro Wagmi/Rainbowkit developer!

We will divide this lesson into three parts - Smart contracts, Subgraph, and Frontend.

## 🤩 Final Output

This is what we will be building, by the end of this lesson series:

![SampleSite](https://i.imgur.com/AZXTh6i.png)

![SampleSite](https://i.imgur.com/s7fNSFk.png)

---

## Smart Contracts

> **⚠️ WARNING:** Following the previous topics, we assume that you have already **created a new wallet for development purposes only with no live funds**. It is essential to only connect to your newly created development Metamask/Alfajores wallet when practicing or testing deployments. **Accidential usage of live wallets can result real ETH usage and an unwanted financial cost.**

Let's create a new directory on your computer, and initialize a Git repo there (which will house all our code) by running the following command :

```shell
mkdir celo-nft-marketplace
cd celo-nft-marketplace
git init
```

Now, let's think about what we need in the NFT marketplace smart contract. We will create the following functions to allow for different actions:

1. `createListing`: Create a listing to put an NFT up for sale
2. `cancelListing`: Cancel a listing you previously created
3. `updateListing` Update a listing you previously created
4. `purchaseListing`: Purchase a listing from someone else

This is a minimalistic version of what goes on in a decentralized NFT marketplace, but it fits well for our purpose.

### 👨‍🔬 Setting Up

Let's set up a new Hardhat project to write our smart contracts.

1. Open up a terminal, and create a folder for Hardhat within the directory you just created

```shell
cd celo-nft-marketplace
mkdir hardhat
cd hardhat
```

2. To set up the project, execute these commands

```shell
npm init --yes
npm install --save-dev hardhat
```

3. If you are on Windows, please do this extra step and install these libraries as well :)

```shell
npm install --save-dev @nomicfoundation/hardhat-toolbox @nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers ethers
```

4. Finally, run the following command and go through the interactive prompt

```shell
npx hardhat
```

- Select `Create a JavaScript project`
- Press enter for the already specified `Hardhat project root`
- Press enter for the question on `Do you want to add a .gitignore`
- If prompted, press enter for `Do you want to install this sample project's dependencies with npm (@nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers ethers)?`

We now have our Hardhat project ready to go!

5. Let's also install OpenZeppelin contracts library while we're here, as we will use `IERC721.sol` later

```shell
npm install @openzeppelin/contracts
```

### 🎨 Building an NFT Contract

Before we build our marketplace, we need to build a simple NFT contract so you actually have some NFTs on testnet you can test this out with. We will not go into too much detail for this, as by this point it should be fairly straightforward.

If you are not familiar with writing NFT contracts, check out the [NFT Collection tutorial in the Sophomore track](https://learnweb3.io).

Open up the folder in your code editor, and create a new file under `hardhat/contracts` called `CeloNFT.sol`. We will use this file to write a simple NFT contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CeloNFT is ERC721 {
    constructor() ERC721("CeloNFT", "cNFT") {
        // mint 5 NFTs to yourself
        for (uint i = 0; i < 5; i++) {
            _mint(msg.sender, i);
        }
    }

    // Hardcoded token URI will return the same metadata
    // for each NFT
    function tokenURI(uint) public pure override returns (string memory) {
        return "ipfs://QmTy8w65yBXgyfG2ZBg5TrfB2hPjrDQH3RCQFJGkARStJb";
    }
}
```

> FUN FACT : Want to know what's in the IPFS link we added? [See for yourself](https://gateway.ipfs.io/ipfs/QmTy8w65yBXgyfG2ZBg5TrfB2hPjrDQH3RCQFJGkARStJb)

We will write the deployment script for this later, along with the one for `CeloNFTMarketplace` that is coming up.

### 💻 Writing the marketplace smart contract

Open up the folder in your code editor, and create a new file under `hardhat/contracts` called `NFTMarketplace.sol`. We will use this file to write all of our smart contract code!

We start off with the basic boilerplate.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace {
    // More code here...
}
```

Let's try to think through how we should structure this code. Looking at the functions we want, everything is centered around the idea of **Listings**.

- It might make sense to have a **struct** to represent all the data in a Listing.
- NFTs from all various different collections can be traded on the marketplace. So a Listing must represent the NFT contract **address, the token ID, the seller address, and the price** at the very least.
- To allow for easy access to Listing data, we can store it as a 2D Mapping of **Contract Address -> (Token ID -> Listing Data)**.
- The marketplace should have `approval` over transferring NFTs that were listed when a buyer purchases a listing.

Add the following struct and mapping to the contract

```solidity
struct Listing {
    uint256 price;
    address seller;
}

// Contract Address -> (Token ID -> Listing Data)
mapping(address => mapping(uint256 => Listing)) public listings;
```

Let's write the `createListing` function now.

```solidity
function createListing(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external {
        // There must be a price of a listing
        require(price > 0, "MRKT: Price must be > 0");

        // Listing must not already exist
        require(
            listings[nftAddress][tokenId].price == 0,
            "MRKT: Already listed"
        );

        // Caller must be owner of the NFT, and has approved
        // the marketplace contract to transfer on their behalf
        IERC721 nftContract = IERC721(nftAddress);
        require(nftContract.ownerOf(tokenId) == msg.sender, "MRKT: Not the owner");
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) ||
                nftContract.getApproved(tokenId) == address(this),
            "MRKT: No approval for NFT"
        );

        // Add the listing to our mapping
        listings[nftAddress][tokenId] = Listing({
            price: price,
            seller: msg.sender
        });
}
```

There's a couple of things we can still do here.

1. Some of the require statements can be abstracted into modifiers, as they will be used across other functions. NFT owner checks and whether or not a listing is already created, specifically.
2. We should emit an event when a listing is created. This will help our subgraph later to know that a new listing has been created, and will allow our frontend to render data accordingly.

Keeping these in mind, let's add the following modifiers and event definition

```solidity
// Caller must be owner of the NFT token ID
modifier isNFTOwner(address nftAddress, uint256 tokenId) {
    require(
        IERC721(nftAddress).ownerOf(tokenId) == msg.sender,
        "MRKT: Not the owner"
    );
    _;
}

// Price must be more than 0
modifier validPrice(uint256 _price) {
    require(price > 0, "MRKT: Price must be > 0");
    _;
}

// Specified NFT must not be listed
modifier isNotListed(address nftAddress, uint256 tokenId) {
    require(
        listings[nftAddress][tokenId].price == 0,
        "MRKT: Already listed"
    );
    _;
}

// We will use this later on
// Specified NFT must be listed
modifier isListed(address nftAddress, uint256 tokenId) {
    require(listings[nftAddress][tokenId].price > 0, "MRKT: Not listed");
    _;
}

// Emitted when an event is created
event ListingCreated(
    address nftAddress,
    uint256 tokenId,
    uint256 price,
    address seller
);
```

Now, we can update `createListing` to be

```solidity
function createListing(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        isNotListed(nftAddress, tokenId)
        isNFTOwner(nftAddress, tokenId)
        validPrice(price)
    {
        IERC721 nftContract = IERC721(nftAddress);
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) ||
                nftContract.getApproved(tokenId) == address(this),
            "MRKT: No approval for NFT"
        );
        listings[nftAddress][tokenId] = Listing({
            price: price,
            seller: msg.sender
        });

        emit ListingCreated(nftAddress, tokenId, price, msg.sender);
    }
```

Great! Let's do `cancelListing` now, which is quite straightforward. We will also add a new event for `ListingCanceled` and emit that as part of the function to assist with indexing later.

```solidity
event ListingCancelled(address nftAddress, uint256 tokenId, address seller);

function cancelListing(address nftAddress, uint256 tokenId)
    external
    isListed(nftAddress, tokenId)
    isNFTOwner(nftAddress, tokenId)
{
    // Delete the Listing struct from the mapping
    // Freeing up storage saves gas!
    delete listings[nftAddress][tokenId];

    // Emit the event
    emit ListingCancelled(nftAddress, tokenId, msg.sender);
}
```

Amazing! Doing great so far!

`updateListing` is also equally straightforward, and we will create an event definition to go with it as well.

```solidity
event ListingUpdated(
    address nftAddress,
    uint256 tokenId,
    uint256 newPrice,
    address seller
);

function updateListing(
    address nftAddress,
    uint256 tokenId,
    uint256 newPrice
) external isListed(nftAddress, tokenId) isNFTOwner(nftAddress, tokenId) validPrice(newPrice) {
    // Update the listing price
    listings[nftAddress][tokenId].price = newPrice;

    // Emit the event
    emit ListingUpdated(nftAddress, tokenId, newPrice, msg.sender);
}
```

Now for the fun part! `purchaseListing` This will involve an ETH transfer from the buyer to the seller, and an NFT transfer from the seller to the buyer. We will also add an event definition to signify the purchase.

```solidity
event ListingPurchased(
    address nftAddress,
    uint256 tokenId,
    address seller,
    address buyer
);

function purchaseListing(address nftAddress, uint256 tokenId)
    external
    payable
    isListed(nftAddress, tokenId)
{
  // Buyer must have sent enough ETH
  require(msg.value == listing.price, "MRKT: Incorrect ETH supplied");

  // Load the listing in a local copy
  Listing memory listing = listings[nftAddress][tokenId];

  // Delete listing from storage, save some gas
  delete listings[nftAddress][tokenId];

  // Transfer NFT from seller to buyer
  IERC721(nftAddress).safeTransferFrom(
      listing.seller,
      msg.sender,
      tokenId
);

// Transfer ETH sent from buyer to seller
(bool sent, ) = payable(listing.seller).call{value: msg.value}("");
require(sent, "Failed to transfer eth");

// Emit the event
emit ListingPurchased(nftAddress, tokenId, listing.seller, msg.sender);
}
```

This is it! Our smart contract is ready! The final code should look something like this

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace {
    struct Listing {
        uint256 price;
        address seller;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    modifier isNFTOwner(address nftAddress, uint256 tokenId) {
        require(
            IERC721(nftAddress).ownerOf(tokenId) == msg.sender,
            "MRKT: Not the owner"
        );
        _;
    }

    modifier validPrice(uint256 _price) {
        require(_price > 0, "MRKT: Price must be > 0");
        _;
    }

    modifier isNotListed(address nftAddress, uint256 tokenId) {
        require(
            listings[nftAddress][tokenId].price == 0,
            "MRKT: Already listed"
        );
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        require(listings[nftAddress][tokenId].price > 0, "MRKT: Not listed");
        _;
    }

    event ListingCreated(
        address nftAddress,
        uint256 tokenId,
        uint256 price,
        address seller
    );

    event ListingCancelled(address nftAddress, uint256 tokenId, address seller);

    event ListingUpdated(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice,
        address seller
    );

    event ListingPurchased(
        address nftAddress,
        uint256 tokenId,
        address seller,
        address buyer
    );

    function createListing(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        isNotListed(nftAddress, tokenId)
        isNFTOwner(nftAddress, tokenId)
        validPrice(price)
    {
        IERC721 nftContract = IERC721(nftAddress);
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) ||
                nftContract.getApproved(tokenId) == address(this),
            "MRKT: No approval for NFT"
        );
        listings[nftAddress][tokenId] = Listing({
            price: price,
            seller: msg.sender
        });

        emit ListingCreated(nftAddress, tokenId, price, msg.sender);
    }

    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isListed(nftAddress, tokenId)
        isNFTOwner(nftAddress, tokenId)
    {
        delete listings[nftAddress][tokenId];
        emit ListingCancelled(nftAddress, tokenId, msg.sender);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isListed(nftAddress, tokenId)
        isNFTOwner(nftAddress, tokenId)
        validPrice(newPrice)
    {
        listings[nftAddress][tokenId].price = newPrice;
        emit ListingUpdated(nftAddress, tokenId, newPrice, msg.sender);
    }

    function purchaseListing(address nftAddress, uint256 tokenId)
        external
        payable
        isListed(nftAddress, tokenId)
    {
        Listing memory listing = listings[nftAddress][tokenId];

        require(msg.value == listing.price, "MRKT: Incorrect ETH supplied");

		    delete listings[nftAddress][tokenId];

        IERC721(nftAddress).safeTransferFrom(
            listing.seller,
            msg.sender,
            tokenId
        );

        (bool sent, ) = payable(listing.seller).call{value: msg.value}("");
        require(sent, "Failed to transfer eth");

        emit ListingPurchased(nftAddress, tokenId, listing.seller, msg.sender);
    }
}
```

Now, it's time to deploy!

### 🚢 Shipping It

We will deploy this code on the Celo Alfajores Testnet, and will use Hardhat to do so. We need to get a few things in order to do this the right way.


This will be quite different to how you'd normally deploy contracts on Polygon/Ethereum.

1. Get the Seed Phrase (mnemonic) of the Celo Alfajores wallet
2. Use environment variables to store our mnemonic
   1. Create a `.env` file
   2. Use `dotenv` package to read environment variables within Hardhat
3. Configure `hardhat.config.js` to Alfajores testnet
4. Write a deployment script for Hardhat to automate deploys

---

> NOTE : We will be using the term Seed Phrase and Mnemonic interchangeably (They mean the same this for this context).

To get your recovery/seed phrase, open your Celo app and select `Recovery Phrase` once you pull the side bar from the left.

You can request testnet tokens using the [Celo Faucet](https://celo.org/developers/faucet).

We'll be using [Forno](https://docs.celo.org/network/node/forno) to get the RPC Endpoint to interact with the Celo Network. Think of this as the Alchemy of Celo.

So, let's create a `.env` file within the `hardhat` folder. Replace the `MNEMONIC_KEY` with your seed phrase.

> NOTE : Just copy paste the seed phrase with the spaces

> WARNING : NEVER SHARE YOUR PRIVATE / SEED PHRASES WITH ANYONE

```shell
# .env file
MNEMONIC_KEY="run deer open shut ....."
```

Great, now let's install the `dotenv` npm package so we can read environment variables from the `.env` file. Open up your terminal within the `hardhat` folder, and execute the following:

```shell
npm install dotenv
```

Awesome! Let's configure the network now. Open up `hardhat.config.js`, and replace its contents with the following:

```javascript
require("@nomiclabs/hardhat-waffle");
require("dotenv").config({ path: ".env" });

// Add the alfajores network to the configuration
module.exports = {
  solidity: "0.8.17",
  networks: {
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: {
        mnemonic: process.env.MNEMONIC_KEY,
        path: "m/44'/52752'/0'/0",
      },
      chainId: 44787,
    },
  },
};
```

> FUN FACT : The path parameter is necessary since this process uses a different kind of connection. This topic is very advanced, but if you want to persue further, it is highly recommended to **complete the Senior Track first before diving into any of the following links** : [Testnet Forno](https://docs.celo.org/developer/deploy/hardhat#connect-to-testnet-using-forno), [HD Wallet Configuration - Hardhat](https://hardhat.org/hardhat-runner/docs/config#hd-wallet-config), [What HD Wallet means](https://github.com/ethereumbook/ethereumbook/blob/develop/05wallets.asciidoc#hd_wallets)

Whew! Once this is done, we can write our deployment script. Create a new file called `deploy.js` in `hardhat/scripts`.

```javascript
const { ethers } = require("hardhat");

async function main() {
  // Load the NFT contract artifacts
  const CeloNFTFactory = await ethers.getContractFactory("CeloNFT");

  // Deploy the contract
  const celoNftContract = await CeloNFTFactory.deploy();
  await celoNftContract.deployed();

  // Print the address of the NFT contract
  console.log("Celo NFT deployed to:", celoNftContract.address);

  // Load the marketplace contract artifacts
  const NFTMarketplaceFactory = await ethers.getContractFactory(
    "NFTMarketplace"
  );

  // Deploy the contract
  const nftMarketplaceContract = await NFTMarketplaceFactory.deploy();

  // Wait for deployment to finish
  await nftMarketplaceContract.deployed();

  // Log the address of the new contract
  console.log("NFT Marketplace deployed to:", nftMarketplaceContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Amazing! If you've done everything correctly, you should now be able to just deploy your contract.

First let's compile the contract, open up a terminal pointing at `hardhat` directory and execute this command

```bash
  npx hardhat compile
```

To deploy, execute this command in the same directory

```shell
npx hardhat run scripts/deploy.js --network alfajores
```

If you see an output that looks like this:

```
Celo NFT deployed to: 0xcC48dA1123dc9e7741FB4040E7A9E010664b51cb
NFT Marketplace deployed to: 0x9014DD98Cd14B26c76069356247cE6d762018220
```

You're all set! You can look up your contract on [CeloScan](https://alfajores.celoscan.io/). Be sure to save your deployed addresses since we'll be needing them, but mostly importly to send a screenshot/CeloScan link of your work in our [Discord Channel](https://discord.gg/zyuxAkbBS5)!

### 🌟 Next Steps

This level was all about the smart contract. Moving forward, we will develop the subgraph for this contract, and then finally develop the frontend for the dApp using Next.

See you in the next one 🌟

To verify this level, submit your Marketplace contract address below and **select the Celo Alfajores Testnet** while doing so.
