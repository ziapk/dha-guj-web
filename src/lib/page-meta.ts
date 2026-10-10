/**
 * Meta titles and descriptions of the main list pages, as given in the client's SEO spec. Titles are used as
 * `title.absolute` so the layout's "| site name" template is not added to them. Filtered and paged copies of a
 * page keep their own generated titles.
 */
export const PAGE_META = {
  home: {
    title: "DHA Gujranwala Plots, Files & Houses for Buy, Sale | DHA GRW Properties",
    description:
      "Buy, sell or invest in DHA Gujranwala plots, files and houses. Get latest prices, maps, balloting updates and trusted property advice. Call 0300 1587684.",
  },
  properties: {
    title: "DHA Gujranwala Properties for Sale | Plots, Files & Houses",
    description:
      "Looking to buy or sell in DHA Gujranwala? View the latest plots, files and houses with sector-wise details, or list your property with our team.",
  },
  sale: {
    title: "Properties for Sale in DHA Gujranwala | Plots, Houses & Files",
    description:
      "Find houses and files for sale in DHA Gujranwala, plus residential and commercial plots. See updated listings and prices, or list your property with us.",
  },
  rent: {
    title: "Houses, Shops & Offices for Rent in DHA Gujranwala | DHA GRW Properties",
    description:
      "Looking for a house to rent in DHA Gujranwala? View updated rental listings, plus houses villas, shops, offices in prime locations. Contact us today 0300 1587684.",
  },
  maps: {
    title: "DHA Gujranwala Map | Sector & Block Maps | DHA GRW Properties",
    description:
      "Explore the DHA Gujranwala map to find sectors, blocks, main roads and plot locations before you buy or invest. Contact us for guidance 0300 1587684.",
  },
  dealers: {
    title: "DHA Gujranwala Authorized Dealers | Property Consultants",
    description:
      "Find authorized DHA Gujranwala dealers and property consultants for buying, selling, renting and investment. Contact DHA GRW at 0300 1587684.",
  },
  agents: {
    title: "Top DHA Gujranwala Real Estate Agents | Buy & Sell",
    description:
      "Looking for a trusted agent in DHA Gujranwala? Find experienced real estate agents for buying, selling, renting and investment. Contact us today 0300 1587684.",
  },
  blog: {
    title: "DHA Gujranwala News, Guides & Property Tips | DHA GRW Properties",
    description:
      "Property news and buying guides for local and overseas investors in DHA Gujranwala. Explore sector guides, market trends and practical real estate tips.",
  },
  authors: {
    title: "Meet Our Real Estate Writers | DHA GRW Properties",
    description:
      "Meet the authors behind DHA GRW's property content. Read about their DHA Gujranwala market experience and explore the articles they have written.",
  },
} as const;
