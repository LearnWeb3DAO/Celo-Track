# Celo's Identity System

From the beginning of this track, we have been talking about Celo's focus on being a mobile-first blockchain. Let's go a little deeper into that concept, and learn about how Celo makes that possible.

Celo's purpose, from the beginning, has always been being able to make financial tools accessible to anyone in the world who has access to a mobile phone. Financial tools that can be unlocked through the power of DeFi, often times in places where users do not even have access to the centralized counterparts.

A barrier for the regular usage of a lot of blockchain systems in underserved areas is the reliance on having a long, hard to remember wallet address. Celo changes this by introducing their lightweight identity system that can map phone numbers to wallet addresses, in a decentralized and secure manner. Let's see how that works.

## Attestation Protocol

![](https://i.imgur.com/B0cQLsI.png)

Attestation means "evidence or proof of something". Celo has an Attestations Protocol which asks users to prove control over a phone number, which they can then link to their wallet address.

Essentially what it is an OTP-based service. You will receive a one-time passcode on your phone through SMS, and submit that OTP to the Attestation Service, through which you prove control over your phone number. Then, the service will link your phone number to your address.

That's pretty simple, and commonly used - but things get tricky when you want to do this in a way where:
1. There is no centralized authority responsible for sending and verifying OTP messages
2. Phone numbers must not be stored on-chain in plaintext, as hackers could try to phish users with high balances through their phone number.

<Quiz questionId="4791e01f-826c-4a07-972e-93b0bb083854" />

So let's try to understand how this flow *actually* works.

## Attestation Service

The Attestation Service is a simple `Node.js` service that is used to send SMS's to phone numbers. It does this by integrating with services like `Twilio` and `Nexmo` - and Celo has plans to expand the number of options available in the future.

This service is run by all validators on the Celo network, i.e. all validators must be able to send SMS's if required.

This is one piece of this puzzle.

## Randomness

Celo has a pseudo-randomness generator built in to the network, and random values can be requested through their deployed `Random` contract on the network.

This randomness allows Celo to perform random validator selection, which is important in this scenario.

This is the second piece of this puzzle.

## The Flow

Now that we have the pieces of the puzzle, let's start putting them together and seeing how this works along with our fictitious character **Alice**.

Suppose Alice has a Celo wallet, and wants to link her phone number, to allow her friends and family to more easily do transactions with her.

![](https://i.imgur.com/9Rkaws4.png)

First, Alice instructs her wallet to request an attestation from the `Attestations` smart contract, that is deployed on the Celo network. To do so, she pays a small gas fees to call a function on the `Attestations` contract.

Secondly, the `Attestations` contract fetches a random value from the `Random` contract, which is used to choose a random validator from the currently active validator set. Since all validators are required to run the Attestation Service, Alice can use them to request a message.

Alice sends a request to the randomly selected validator to issue her an OTP. The validator signs over Alice's identifier (more on this in the next section) using their private key, and sends the signed message to Alice over SMS.

When Alice receives this message, she can submit this message to the `Attestations` smart contract - which verifies the signature and verifies that it indeed came from the randomly selected validator. If everything checked out, Alice's identifier is now linked to her wallet address.

Upon a successful verification, the validator can then redeem an attestation fee from the contract to reimburse the cost of sending the SMS. 

## Privacy

Great! So we have been able to link an identifier to Alice's wallet address.

But what exactly is this identifier?

We surely cannot store Alice's phone number directly. That would make it too easy for hackers to look up the phone numbers of any wallet with a high balance, and then attempt to phish them.

It is also not secure to just store a simple hash of the phone number, as there are a limited number of phone numbers in the world. An attacker could perform a [Rainbow Table Attack](https://en.wikipedia.org/wiki/Rainbow_table).

---

### What is a Rainbow Table attack?
A rainbow table is a list of precomputed hash values for certain inputs. It is commonly used by attackers to figure out the input values, given a hash, for common inputs.

Since there are a relatively small number of phone numbers that exist in the entire world, and more so especially when you factor in things like area codes, country codes, etc - it is relatively inexpensive to just calculate the hash of every possible phone number and store it in a table.

Then, an attacker could look at the smart contract and figure out what phone number matches the hash stored in the contract.

---

So we cannot store Alice's phone number in plaintext, and we cannot store it as a simple hash value. What do we do?

<Quiz questionId="572b6f66-7d3c-4548-bee3-2bcab10bcc4e" />

This is where **ODIS** comes in. ODIS stands for the **Oblivious Decentralized Identifier Service** (not to be confused with Decentralized ID technology).

Let's dig a little deeper into ODIS.

## ODIS

The Oblivious Decentralized Identifier Service is a service which computes a pseudorandom function (a PRF). 

Without making it sound like technical jargon, the crux of it falls as such.

ODIS behaves like a multi-sig wallet, wherein multiple entities control different parts of a key, that can be combined together to produce a value. As of October 2021, there are 7 signers, with a threshold of 5 signers required to compute the PRF function. 

This PRF function takes in a certain input, and produces an output given that the threshold number of signers agreed to compute it (5/7). 

In the case of phone number identifiers, ODIS is used to produce what is called a **pepper** in cryptography. The output of the PRF function is treated as a pepper.

A pepper is a random value, that is attached to a certain input before producing the hash of the input, such that the input is no longer susceptible to a rainbow table attack.

Think of it like this, an attacker could create a rainbow table of all phone numbers in existence, but they could not guess what the random pepper value was that got attached to the phone numbers before they were hashed, i.e. making their entire rainbow table useless.

<Quiz questionId="89f54341-27be-4b69-90c2-c0beac72933b" />

---

So how is the pepper used for privacy protection of phone numbers on Celo? Let's revisit the example above of Alice.

Alice's identifier is linked to her wallet address. The identifier is actually her phone number, combined with a pepper, and the hash of those two things together is stored in the contract as a mapping to her address.

```javascript
Hash(pepper + phoneNum)
```

Now, when Bob wants to send Alice money, Bob should have Alice's phone number. 

Bob's wallet can request ODIS for the pepper associated with Alice's phone number. ODIS will return the pepper to the wallet, and the wallet can then compute Alice's identifier by combining the pepper and her phone number.

Once the identifier has been computed, the wallet can look at the `Attestations` smart contract and read a public mapping to determine Alice's wallet address based on the computed identifier.

This would then allow Bob to transfer money to Alice using only her phone number.

---

BUT...

You might be thinking, if we can just request ODIS to send us the pepper, how is that any better? Why can't an attacker just get the pepper for every phone number, and then build a rainbow table out of that?

![](https://i.imgur.com/y9BbyOX.png)


Well, the answer is that ODIS is rate limited. ODIS calculates an account's reputation based on transaction history, requests history, account balance, etc. These limits are set in a way to prohibit scraping large numbers of peppers, while allowing typical user wallets to conveniently fetch peppers for their contacts.

<Quiz questionId="b17f4a8e-2fc5-4781-8a54-635db594c705" />

## Conclusion

Overall, Celo has established a decentralized, secure system for mapping phone numbers to addresses. Not only does this enable sending money to a phone number to someone who has linked their account, it actually also allows sending money to someone who has not even signed up yet for Celo!

Through Celo's `Escrow` contract, you can send money to a phone number - and that money will be stored safely in the smart contract until the recipient signs up for an account on Celo and links their phone number to their account. Once they do that, they can withdraw the money from the `Escrow` contract.

Considering Celo's primary target market is underserved communities and developing nations where most people are not tech savvy, the addition of this mapping, built directly into the native network, produces a huge impact on end user experience.

As always, if you have any questions, feel free to ask on Discord! 

## Readings
These readings are optional, but recommended.

- [ODIS](https://docs.celo.org/celo-codebase/protocol/odis)
- [Node.js script to look up phone number on ODIS](https://gist.github.com/critesjosh/71d5534511627b6e1bccd790be747606)

<SubmitQuiz />
