import {
  ListingCanceled,
  ListingCreated,
  ListingPurchased,
  ListingUpdated,
} from "../generated/NFTMarketplace/NFTMarketplace";
import { store } from "@graphprotocol/graph-ts";
import { ListingEntity } from "../generated/schema";

export function handleListingCanceled(event: ListingCanceled): void {
  // Recreate the ID that refers to the listing
  // Since the listing is being updated, the datastore must already have an entity with this ID
  // from when the listing was first created
  const id =
    event.params.nftAddress.toHex() +
    "-" +
    event.params.tokenId.toString() +
    "-" +
    event.params.seller.toHex();

  // Load the listing to see if it exists
  let listing = ListingEntity.load(id);

  // If it does
  if (listing) {
    // Remove it from the store
    store.remove("ListingEntity", id);
  }
}

export function handleListingCreated(event: ListingCreated): void {
  // Create a unique ID that refers to this listing
  // The NFT Contract Address + Token ID + Seller Address can be used to uniquely refer
  // to a specific listing
  const id =
    event.params.nftAddress.toHex() +
    "-" +
    event.params.tokenId.toString() +
    "-" +
    event.params.seller.toHex();

  // Create a new entity and assign it's ID
  let listing = new ListingEntity(id);

  // Set the properties of the listing, as defined in the schema,
  // based on the event
  listing.seller = event.params.seller;
  listing.nftAddress = event.params.nftAddress;
  listing.tokenId = event.params.tokenId;
  listing.price = event.params.price;

  // Save the listing to the nodes, so we can query it later
  listing.save();
}

export function handleListingPurchased(event: ListingPurchased): void {
  // Recreate the ID that refers to the listing
  // Since the listing is being updated, the datastore must already have an entity with this ID
  // from when the listing was first created
  const id =
    event.params.nftAddress.toHex() +
    "-" +
    event.params.tokenId.toString() +
    "-" +
    event.params.seller.toHex();

  // Attempt to load a pre-existing entity, instead of creating a new one
  let listing = ListingEntity.load(id);

  // If it exists
  if (listing) {
    // Set the buyer
    listing.buyer = event.params.buyer;

    // Save the changes
    listing.save();
  }
}

export function handleListingUpdated(event: ListingUpdated): void {
  // Recreate the ID that refers to the listing
  // Since the listing is being updated, the datastore must already have an entity with this ID
  // from when the listing was first created
  const id =
    event.params.nftAddress.toHex() +
    "-" +
    event.params.tokenId.toString() +
    "-" +
    event.params.seller.toHex();

  // Attempt to load a pre-existing entity, instead of creating a new one
  let listing = ListingEntity.load(id);

  // If it exists
  if (listing) {
    // Update the price
    listing.price = event.params.newPrice;

    // Save the changes
    listing.save();
  }
}
