# Ship a _true_ NFT Marketplace on Celo - Part 3

![](https://i.imgur.com/6N5ECMl.png)

Finally it's time to build the part of our project folks can interact with!

Smart Contracts ✅
Deployment Scripts ✅
Subgraph ✅
Frontend ☑️

It's time to build our frontend now. As always, we will be using [Next.js](https://nextjs.org/) to do so.

## Website Development

### 👨‍🔬 Setting Up

1. Open up your terminal, and enter the `celo-nft-marketplace` directory

   ```shell
   cd celo-nft-marketplace
   ```

2. Initialize a new Next.js app by running the following command

   ```shell
   npx create-next-app@latest frontend
   ```

We now have a fresh new Next.js project ready to go!

### 😎 Git Good

The `create-next-app` tool also initializes a Git repo when it sets up the project. However, since our parent directory `celo-nft-marketplace` is already a Git repo, we don't want to keep the `frontend` folder as a separate Git repo to avoid having one Git repo inside another Git repo (Git submodules).

Run the following command in your terminal

```shell
cd frontend

# Linux / macOS
rm -rf .git

# Windows
rmdir /s /q .git
```

### 🥅 The Goal

By the end, we want to have a few different sections of our app.

1. Homepage - View all listings
2. NFT Details - View a specific listing, allow updating/canceling listing if owner
3. Create Listing - Add a new listing

The way it will work is as follows:

The homepage will retrieve data from our subgraph, to display all currently active listings and their prices.

Clicking on a listing from the homepage will bring us to the NFT details page, where users will have the option to buy the NFT. If they are the seller, they will have the option to update the price or cancel the listing.

There will be a separate Create Listing page where users can enter the NFT Contract Address and Token ID of the NFT they want to sell, and a new listing will be created.

### ⛩ File Structure

The `pages` directory within the `frontend` folder is where we will be doing most of our work. Right now, the `pages` directory should look something like this

```
pages/
├─ api/
│  ├─ hello.js
├─ _app.js
├─ index.js
```

We won't be doing any backend here, so we can get rid of the `api` folder. So go ahead and delete that.

`index.js` is our homepage, and we will use that to display all listings.

Apart from that, create a new file `create.js` under `pages`, which will be the Create Listing page.

Then, create a new directory called `[nftContract]`, and within it, a file called `[tokenId].js`. This will be a dynamic route, used to show a specific listing.

Now, we will also be creating some React components to increase reusability across pages, so we don't write the same code multiple times.

Create a directory named `components` under `frontend`, and we will add some components here as we go.

By the end, you should have a structure that looks like this:

```
components/
pages/
├─ [nftContract]/
│  ├─ [tokenId].js
├─ _app.js
├─ create.js
├─ index.js
```

### 💰 Initializing Wallet Connection

We will use [RainbowKit](https://www.rainbowkit.com/) to simplify wallet connection for our dApp.

Install the required dependencies for RainbowKit to get started. Run the following in your terminal, while pointing to the `frontend` directory

```shell
npm install @rainbow-me/rainbowkit wagmi ethers
```

We are all familiar with what `ethers` is. `RainbowKit` is a React component library which makes it easy to connect to wallets. Under the hood, it uses `wagmi`, which is a React hooks library to interact with contracts and wallets.

To get RainbowKit to work across your entire app, we need to make some changes to `_app.js`. This is a one-time setup, and will make wallet connection available throughout the rest of our app with ease.

Open up `_app.js` and add the following imports first of all.

```javascript
import "@rainbow-me/rainbowkit/styles.css";
import "../styles/globals.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
```

Now, we will create a configuration object for the Celo Alfajores chain, as required by RainbowKit/wagmi

```javascript
const celoChain = {
  id: 44787,
  name: "Celo Alfajores Testnet",
  network: "alfajores",
  nativeCurrency: {
    decimals: 18,
    name: "Celo",
    symbol: "CELO",
  },
  rpcUrls: {
    default: "https://alfajores-forno.celo-testnet.org",
  },
  blockExplorers: {
    default: {
      name: "CeloScan",
      url: "https://alfajores.celoscan.io",
    },
  },
  testnet: true,
};
```

Now, we will configure the providers and connectors, which will let RainbowKit know how to interact with the chain

```javascript
const { chains, provider } = configureChains(
  [celoChain],
  [
    jsonRpcProvider({
      rpc: (chain) => {
        if (chain.id !== celoChain.id) return null;
        return { http: chain.rpcUrls.default };
      },
    }),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "Celo NFT Marketplace",
  chains,
});
```

Almost there! We will initialize a wagmi client that combines all the above information, that RainbowKit will use under the hood.

```javascript
const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});
```

Lastly, we will modify the `MyApp` component that was present in `_app.js` and wrap our code with the Wagmi and RainbowKit providers, so it looks like this

```jsx
function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
```

This code may seem a bit convoluted at first, but most of this is taken directly from RainbowKit documentation. All we are doing is configuring Wagmi and RainbowKit, telling it what chains we want our dApp to support, configuring the chain object, and then wrapping our entire app with the Wagmi and RainbowKit providers so it has access to this data throughout the app.

### ✍️ ABIs

To interact with our contracts, we need the ABIs. In our case, we need an ABI for ERC721 contracts (we can just use the CeloNFT for this), and an ABI for our NFT Marketplace.

Create an `abis` folder under `frontend`, and create two files there - `ERC721.json` and `NFTMarketplace.json`.

Copy over the ABI from `hardhat/artifacts/contracts/CeloNFT.sol/CeloNFT.json` into `ERC721.json`, and copy over the `hardhat/artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json` into `NFTMarketplace.json`

### 🗺 Navbar Component

At the top of every page should be a navigation bar to let users switch between pages. It will also contain the RainbowKit button to connect wallets. We will build a simple Navbar component for this.

Create a file `Navbar.js` under `components`, and write the following code there:

```jsx
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "../styles/Navbar.module.css";

export default function Navbar() {
  return (
    <div className={styles.navbar}>
      <Link href="/">Home</Link>
      <Link href="/create">Create Listing</Link>

      <ConnectButton />
    </div>
  );
}
```

Also create a CSS file under the `styles` folder, named `Navbar.module.css`, and add the following code there:

```css
.navbar {
  display: flex;
  justify-content: center;
  column-gap: 2em;
  align-items: center;
  background-color: antiquewhite;
  padding: 1em 0 1em 0;
  font-size: 16px;
}

.navbar a:hover {
  font-weight: bold;
}
```

This should give us a simple Navbar component we can use across both our pages later.

### 🏷 Listing Component

Another component that will be reused a lot is the Listing component, that shows information about each listing. We will reuse this for every listing we get from our subgraph on the homepage.

Create a file `Listing.js` under `components`, and write the following code there:

```jsx
import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider } from "wagmi";
import ERC721ABI from "../abis/ERC721.json";
import styles from "../styles/Listing.module.css";
import { formatEther } from "ethers/lib/utils";

export default function Listing(props) {
  // State variables to hold information about the NFT
  const [imageURI, setImageURI] = useState("");
  const [name, setName] = useState("");

  // Loading state
  const [loading, setLoading] = useState(true);

  // Get the provider, connected address, and a contract instance
  // for the NFT contract using wagmi
  const provider = useProvider();
  const { address } = useAccount();
  const ERC721Contract = useContract({
    addressOrName: props.nftAddress,
    contractInterface: ERC721ABI,
    signerOrProvider: provider,
  });

  // Check if the NFT seller is the connected user
  const isOwner = address.toLowerCase() === props.seller.toLowerCase();

  // Fetch NFT details by resolving the token URI
  async function fetchNFTDetails() {
    try {
      // Get token URI from contract
      let tokenURI = await ERC721Contract.tokenURI(0);
      // If it's an IPFS URI, replace it with an HTTP Gateway link
      tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

      // Resolve the Token URI
      const metadata = await fetch(tokenURI);
      const metadataJSON = await metadata.json();

      // Extract image URI from the metadata
      let image = metadataJSON.imageUrl;
      // If it's an IPFS URI, replace it with an HTTP Gateway link
      image = image.replace("ipfs://", "https://ipfs.io/ipfs/");

      // Update state variables
      setName(metadataJSON.name);
      setImageURI(image);
      setLoading(false);
    } catch (error) {}
  }

  // Fetch the NFT details when component is loaded
  useEffect(() => {
    fetchNFTDetails();
  }, []);

  return (
    <div>
      {loading ? (
        <span>Loading...</span>
      ) : (
        <div className={styles.card}>
          <img src={imageURI} />
          <div className={styles.container}>
            <span>
              <b>
                {name} - #{props.tokenId}
              </b>
            </span>
            <span>Price: {formatEther(props.price)} CELO</span>
            <span>
              Seller: {isOwner ? "You" : props.seller.substring(0, 6) + "..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```

Also create a corresponding CSS file named `Listing.module.css` in the `styles` folder, with the following code

```css
.card {
  /* Add shadows to create the "card" effect */
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  transition: 0.3s;
  width: 256px;
  border-radius: 5%;
  cursor: pointer;
  margin-top: 1rem;
  margin-left: 1rem;
}

.card img {
  width: 100%;
  border-top-left-radius: 5%;
  border-top-right-radius: 5%;
}

/* On mouse-over, add a deeper shadow */
.card:hover {
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
}

/* Add some padding inside the card container */
.container {
  display: flex;
  flex-direction: column;
  padding: 2px 16px;
}
```

### 🏠 The Homepage

Great, we have the core components ready to start building our homepage now. The flow will look something like this:

1. Fetch all currently active listings from our subgraph
2. Render an `Listing` component for each listing with it's respective data
3. Have the components redirect to the NFT Details page when clicked

To get started with querying the subgraph, let's install the requisite libraries which will help us make GraphQL queries. Run the following in your terminal, while pointing to the `frontend` directory

```shell
npm install urql graphql
```

Now, grab your Subgraph API URL. Go to [The Graph Dashboard](https://thegraph.com/hosted-service/dashboard), click on your subgraph, and copy the `Queries (HTTP)` link.

Create a new file called `constants.js` in the `frontend` directory, and add the following code. Make sure to replace the value of `SUBGRAPH_URL` with yours.

```javascript
export const SUBGRAPH_URL =
  "https://api.thegraph.com/subgraphs/name/haardikk21/celo-nft-marketplace";
```

Then, replace `pages/index.js` default generated code with the following.

```jsx
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Listing from "../components/Listing";
import { createClient } from "urql";
import styles from "../styles/Home.module.css";
import Link from "next/link";
import { SUBGRAPH_URL } from "../constants";
import { useAccount } from "wagmi";

export default function Home() {
  // State variables to contain active listings and signify a loading state
  const [listings, setListings] = useState();
  const [loading, setLoading] = useState(false);

  const { isConnected } = useAccount();

  // Function to fetch listings from the subgraph
  async function fetchListings() {
    setLoading(true);
    // The GraphQL query to run
    const listingsQuery = `
      query ListingsQuery {
        listingEntities {
          id
          nftAddress
          tokenId
          price
          seller
          buyer
        }
      }
    `;

    // Create a urql client
    const urqlClient = createClient({
      url: SUBGRAPH_URL,
    });

    // Send the query to the subgraph GraphQL API, and get the response
    const response = await urqlClient.query(listingsQuery).toPromise();
    const listingEntities = response.data.listingEntities;

    // Filter out active listings i.e. ones which haven't been sold yet
    const activeListings = listingEntities.filter((l) => l.buyer === null);

    // Update state variables
    setListings(activeListings);
    setLoading(false);
  }

  useEffect(() => {
    // Fetch listings on page load once wallet connection exists
    if (isConnected) {
      fetchListings();
    }
  }, []);

  return (
    <>
      {/* Add Navbar to homepage */}
      <Navbar />

      {/* Show loading status if query hasn't responded yet */}
      {loading && isConnected && <span>Loading...</span>}

      {/* Render the listings */}
      <div className={styles.container}>
        {!loading &&
          listings &&
          listings.map((listing) => {
            return (
              <Link
                key={listing.id}
                href={`/${listing.nftAddress}/${listing.tokenId}`}
              >
                <a>
                  <Listing
                    nftAddress={listing.nftAddress}
                    tokenId={listing.tokenId}
                    price={listing.price}
                    seller={listing.seller}
                  />
                </a>
              </Link>
            );
          })}
      </div>

      {/* Show "No listings found" if query returned empty */}
      {!loading && listings && listings.length === 0 && (
        <span>No listings found</span>
      )}
    </>
  );
}
```

Now open up `styles/Home.module.css` and replace the code there with the following simple CSS

```css
.container {
  display: flex;
  flex-wrap: wrap;
}
```

### 🆕 Create Listing Page

We will do the 'Create Listing' page before we do NFT Details, because currently our marketplace has no listings, which means our subgraph has no listings, which means our homepage looks empty. So let's create the functionality to add a new listing, and that will allow us to see our homepage in action.

The flow will look something like this:

1. User enters the NFT contract address and the Token ID they want to sell
2. We check if the marketplace already has approval for that NFT collection from the user or not
3. If not, we prompt for getting approval over the NFT collection from the user
4. Then, we make a `createListing` transaction to the marketplace

Grab the contract address of the NFT Marketplace we deployed in Part 1, we need that here.

Open up `constants.js`, and add the following line there. Make sure you replace `MARKETPLACE_ADDRESS` with yours.

```javascript
export const MARKETPLACE_ADDRESS = "0x88b7f8A53E59f9ff3539c9DbDc1c32DDB9c803f1";
```

Now open up `pages/create.js`, and add the following code there. Make sure to understand the code, and write it yourself instead of copy-pasting.

```jsx
import { Contract } from "ethers";
import { isAddress, parseEther } from "ethers/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { useSigner } from "wagmi";
import ERC721ABI from "../abis/ERC721.json";
import MarketplaceABI from "../abis/NFTMarketplace.json";
import Navbar from "../components/Navbar";
import styles from "../styles/Create.module.css";
import { MARKETPLACE_ADDRESS } from "../constants";

export default function Create() {
  // State variables to contain information about the NFT being sold
  const [nftAddress, setNftAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showListingLink, setShowListingLink] = useState(false);

  // Get signer from wagmi
  const { data: signer } = useSigner();

  // Main function to be called when 'Create' button is clicked
  async function handleCreateListing() {
    // Set loading status to true
    setLoading(true);

    try {
      // Make sure the contract address is a valid address
      const isValidAddress = isAddress(nftAddress);
      if (!isValidAddress) {
        throw new Error(`Invalid contract address`);
      }

      // Request approval over NFTs if requred, then create listing
      await requestApproval();
      await createListing();

      // Start displaying a button to view the NFT details
      setShowListingLink(true);
    } catch (error) {
      console.error(error);
    }

    // Set loading status to false
    setLoading(false);
  }

  // Function to check if NFT approval is required
  async function requestApproval() {
    // Get signer's address
    const address = await signer.getAddress();

    // Initialize a contract instance for the NFT contract
    const ERC721Contract = new Contract(nftAddress, ERC721ABI, signer);

    // Make sure user is owner of the NFT in question
    const tokenOwner = await ERC721Contract.ownerOf(tokenId);
    if (tokenOwner.toLowerCase() !== address.toLowerCase()) {
      throw new Error(`You do not own this NFT`);
    }

    // Check if user already gave approval to the marketplace
    const isApproved = await ERC721Contract.isApprovedForAll(
      address,
      MARKETPLACE_ADDRESS
    );

    // If not approved
    if (!isApproved) {
      console.log("Requesting approval over NFTs...");

      // Send approval transaction to NFT contract
      const approvalTxn = await ERC721Contract.setApprovalForAll(
        MARKETPLACE_ADDRESS,
        true
      );
      await approvalTxn.wait();
    }
  }

  // Function to call `createListing` in the marketplace contract
  async function createListing() {
    // Initialize an instance of the marketplace contract
    const MarketplaceContract = new Contract(
      MARKETPLACE_ADDRESS,
      MarketplaceABI,
      signer
    );

    // Send the create listing transaction
    const createListingTxn = await MarketplaceContract.createListing(
      nftAddress,
      tokenId,
      parseEther(price)
    );
    await createListingTxn.wait();
  }

  return (
    <>
      {/* Show the navigation bar */}
      <Navbar />

      {/* Show the input fields for the user to enter contract details */}
      <div className={styles.container}>
        <input
          type="text"
          placeholder="NFT Address 0x..."
          value={nftAddress}
          onChange={(e) => setNftAddress(e.target.value)}
        />
        <input
          type="text"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Price (in CELO)"
          value={price}
          onChange={(e) => {
            if (e.target.value === "") {
              setPrice("0");
            } else {
              setPrice(e.target.value);
            }
          }}
        />
        {/* Button to create the listing */}
        <button onClick={handleCreateListing} disabled={loading}>
          {loading ? "Loading..." : "Create"}
        </button>

        {/* Button to take user to the NFT details page after listing is created */}
        {showListingLink && (
          <Link href={`/${nftAddress}/${tokenId}`}>
            <a>
              <button>View Listing</button>
            </a>
          </Link>
        )}
      </div>
    </>
  );
}
```

Also create a file named `Create.module.css` under the `styles` folder and add the following CSS there:

```css
.container {
  display: flex;
  flex-direction: column;
  padding: 5rem;
  margin: auto;
  margin-top: auto;
  border-radius: 1rem;
  border: 1px solid black;
  background-color: aliceblue;
  width: 50%;
  margin-top: 5%;
}

.container input {
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin: 1rem 0 1rem 0;
}

.container button:first-of-type {
  margin-bottom: 1rem;
}
```

Your page should now look something like this:

![](https://i.imgur.com/JZe73iK.png)

Go ahead and fill out the information. Use the NFT Contract Address we deployed in Part 1, put in anything for Token ID from 0 to 4, and set a price in CELO. Click `Create` and wait for the transactions to go through.

I created two such listings, and then visiting the homepage it should look something like this:

![](https://i.imgur.com/AZXTh6i.png)

### ℹ The NFT Details Page

We're almost done! We just need to create the NFT Details page now. This is where users can buy, cancel, or update listings. The flow will be something like this:

1. User clicks on a listing to go to the NFT Details page
2. If the user is the seller, we show them options to update or cancel the listing
3. If the user is not the seller, we show them options to buy the listing

Open up `pages/[nftContract]/[tokenId].js` and add the following code. Again, make sure you understand and write the code yourself, and not copy-paste.

```jsx
import { Contract } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createClient } from "urql";
import { useContract, useSigner } from "wagmi";
import ERC721ABI from "../../abis/ERC721.json";
import MarketplaceABI from "../../abis/NFTMarketplace.json";
import Navbar from "../../components/Navbar";
import { MARKETPLACE_ADDRESS, SUBGRAPH_URL } from "../../constants";
import styles from "../../styles/Details.module.css";

export default function NFTDetails() {
  // Extract NFT contract address and Token ID from URL
  const router = useRouter();
  const nftAddress = router.query.nftContract;
  const tokenId = router.query.tokenId;

  // State variables to contain NFT and listing information
  const [listing, setListing] = useState();
  const [name, setName] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // State variable to contain new price if updating listing
  const [newPrice, setNewPrice] = useState("");

  // State variables to contain various loading states
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [buying, setBuying] = useState(false);

  // Fetch signer from wagmi
  const { data: signer } = useSigner();

  const MarketplaceContract = useContract({
    addressOrName: MARKETPLACE_ADDRESS,
    contractInterface: MarketplaceABI,
    signerOrProvider: signer,
  });

  async function fetchListing() {
    const listingQuery = `
        query ListingQuery {
            listingEntities(where: {
                nftAddress: "${nftAddress}",
                tokenId: "${tokenId}"
            }) {
                id
                nftAddress
                tokenId
                price
                seller
                buyer
            }
        }
    `;

    const urqlClient = createClient({ url: SUBGRAPH_URL });

    // Send the query to the subgraph GraphQL API, and get the response
    const response = await urqlClient.query(listingQuery).toPromise();
    const listingEntities = response.data.listingEntities;

    // If no active listing is found with the given parameters,
    // inform user of the error, then redirect to homepage
    if (listingEntities.length === 0) {
      window.alert("Listing does not exist or has been canceled");
      return router.push("/");
    }

    // Grab the first listing - which should be the only one matching the parameters
    const listing = listingEntities[0];

    // Get the signer address
    const address = await signer.getAddress();

    // Update state variables
    setIsActive(listing.buyer === null);
    setIsOwner(address.toLowerCase() === listing.seller.toLowerCase());
    setListing(listing);
  }

  // Function to fetch NFT details from it's metadata, similar to the one in Listing.js
  async function fetchNFTDetails() {
    const ERC721Contract = new Contract(nftAddress, ERC721ABI, signer);
    let tokenURI = await ERC721Contract.tokenURI(tokenId);
    tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

    const metadata = await fetch(tokenURI);
    const metadataJSON = await metadata.json();

    let image = metadataJSON.imageUrl;
    image = image.replace("ipfs://", "https://ipfs.io/ipfs/");

    setName(metadataJSON.name);
    setImageURI(image);
  }

  // Function to call `updateListing` in the smart contract
  async function updateListing() {
    setUpdating(true);
    const updateTxn = await MarketplaceContract.updateListing(
      nftAddress,
      tokenId,
      parseEther(newPrice)
    );
    await updateTxn.wait();
    await fetchListing();
    setUpdating(false);
  }

  // Function to call `cancelListing` in the smart contract
  async function cancelListing() {
    setCanceling(true);
    const cancelTxn = await MarketplaceContract.cancelListing(
      nftAddress,
      tokenId
    );
    await cancelTxn.wait();
    window.alert("Listing canceled");
    await router.push("/");
    setCanceling(false);
  }

  // Function to call `buyListing` in the smart contract
  async function buyListing() {
    setBuying(true);
    const buyTxn = await MarketplaceContract.purchaseListing(
      nftAddress,
      tokenId,
      {
        value: listing.price,
      }
    );
    await buyTxn.wait();
    await fetchListing();
    setBuying(false);
  }

  // Load listing and NFT data on page load
  useEffect(() => {
    if (router.query.nftContract && router.query.tokenId && signer) {
      Promise.all([fetchListing(), fetchNFTDetails()]).finally(() =>
        setLoading(false)
      );
    }
  }, [router, signer]);

  return (
    <>
      <Navbar />
      <div>
        {loading ? (
          <span>Loading...</span>
        ) : (
          <div className={styles.container}>
            <div className={styles.details}>
              <img src={imageURI} />
              <span>
                <b>
                  {name} - #{tokenId}
                </b>
              </span>
              <span>Price: {formatEther(listing.price)} CELO</span>
              <span>
                <a
                  href={`https://alfajores.celoscan.io/address/${listing.seller}`}
                  target="_blank"
                >
                  Seller:{" "}
                  {isOwner ? "You" : listing.seller.substring(0, 6) + "..."}
                </a>
              </span>
              <span>Status: {listing.buyer === null ? "Active" : "Sold"}</span>
            </div>

            <div className={styles.options}>
              {!isActive && (
                <span>
                  Listing has been sold to{" "}
                  <a
                    href={`https://alfajores.celoscan.io/address/${listing.buyer}`}
                    target="_blank"
                  >
                    {listing.buyer}
                  </a>
                </span>
              )}

              {isOwner && isActive && (
                <>
                  <div className={styles.updateListing}>
                    <input
                      type="text"
                      placeholder="New Price (in CELO)"
                      value={newPrice}
                      onChange={(e) => {
                        if (e.target.value === "") {
                          setNewPrice("0");
                        } else {
                          setNewPrice(e.target.value);
                        }
                      }}
                    ></input>
                    <button disabled={updating} onClick={updateListing}>
                      Update Listing
                    </button>
                  </div>

                  <button
                    className={styles.btn}
                    disabled={canceling}
                    onClick={cancelListing}
                  >
                    Cancel Listing
                  </button>
                </>
              )}

              {!isOwner && isActive && (
                <button
                  className={styles.btn}
                  disabled={buying}
                  onClick={buyListing}
                >
                  Buy Listing
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
```

Also create a corresponding CSS file `Details.module.css` under the `styles` folder.

```css
.container {
  display: flex;
  width: 80%;
  margin: auto;
  margin-top: 2rem;
}

.details {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.details img {
  width: 512px;
  border-radius: 2rem;
}

.details span {
  margin: 0.25rem;
  padding: 1rem;
  width: 100%;
  text-align: center;
  background-color: lightblue;
  border-radius: 1rem;
}

.details span:first-of-type {
  margin-top: 1rem;
}

.options {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.updateListing {
  display: flex;
  justify-content: space-between;
}

.updateListing input {
  margin-right: 1rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #cccccc;
}

.btn {
  margin-top: 1rem;
  padding: 0.5rem;
}
```

By the end, you should get something like this if you're the owner of the listing:

![](https://i.imgur.com/eLfyZs2.png)

And something like this if you're not the owner of the listing:

![](https://i.imgur.com/s7fNSFk.png)

### 🎁 Wrapping Up

We're done with the website, and with that, the entire project! Woohoo!

We wrote a lot of code over this series, and explored a bunch of tools and libraries.

Push your entire `celo-nft-marketplace` repo to Github, and deploy the `frontend` on Vercel. Share your dApp in the `#showcase` channel on Discord and Twitter to share your progress!

### 🛠 Further Improvements

If you'd like to take this NFT Marketplace project even further, here are a few improvements you can make:

1. Allow users to list NFTs in multiple currencies - specifically including the cUSD and cEUR stablecoins
2. Allow buyers to pay for gas using cUSD and cEUR instead of CELO token by specifying the `feeCurrency` variable when making transactions
3. Create a page to show previously sold listings on the platform

### 🎬 Conclusion

Hope you had as much fun doing this tutorial as we did writing it. As always, share your progress on Twitter, don't forget to tag @LearnWeb3DAO, and ask for help in the Discord if you ever feel lost!

To verify this level, submit the subgraph URL below and select 'The Graph' as the network.

Cheers 🥂
