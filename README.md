# Crazyparts Mix Cart Addon

**Version:** 1.1 · **Site:** crazyparts.com.au

Add multiple colour or variant combinations of the same product to your Crazyparts cart in a single click. Works on the new Crazyparts website.

---

## What It Does

On any Crazyparts product page with multiple colour/variant options, the script adds a **Mix Cart** panel below the standard add-to-cart button:

- Select multiple variants using checkboxes
- Set a quantity for each, **or** use **Auto Split** — a randomisation algorithm that distributes a total quantity across variants automatically
- Click **Add All to Cart** — all selected variants are added in one operation
- Shows progress and confirmation for each item added

---

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome
2. Click **Raw** on the `.user.js` file in this repo
3. Tampermonkey will prompt to install — click **Install**
4. Open any multi-variant product page on Crazyparts — the Mix Cart panel appears below the cart button

---

## Notes

- Only appears on product pages that have multiple colour/variant options
- The **Auto Split** feature uses a randomisation algorithm to distribute quantities — useful for mixed stock orders
- If the panel does not appear, refresh the page — some product pages load variant data asynchronously
- Works on the current (new) Crazyparts website

---

## Using Multiple Scripts

If you are using several of the THVjQ Tampermonkey scripts, check the **Issues** tab — a multi-script addon with live updates across all scripts is in progress. Leave a comment and it will be prioritised.
