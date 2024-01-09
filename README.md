## Grad Student Life: Cost of Living @UBC


This scrollable explainer shows the current financial struggle of UBC CS graduate students.

This project is a fork of [vlandham's scroll_demo](https://github.com/vlandham/scroll_demo) and the visualizations are created with [D3](https://d3js.org/) V4.

### Structure

- assets: external images.
- css: stylesheets. Mainly refer to [vlandham's scroll_demo](https://github.com/vlandham/scroll_demo) but have been changed a lot.
- data: datasets used in visualizations.
- js: javascripts.
  - scroller.js: handles the logic of scroller. We does not change anything from the [original version](https://github.com/vlandham/scroll_demo/blob/gh-pages/js/scroller.js).
  - sections.js: bridges the scroller and the content. This is where the majority of our work sits and contains all the visualizations used in the explainer.
- lib: d3v4 library.
- index.html: main page where the content of the explainer sits.

### How to run
You can access [the page directly here](https://csb-3gzrqn-pnl2vqbwy-tommyvn-ubcca.vercel.app/).

~~The cost of living data can be found here:~~ This data was removed for privacy reason.

The university comparison data can be found here: https://docs.google.com/spreadsheets/d/1h6S92_bJ8YvDWPR_CEmTqrh5J6gwK_O_a7PZlIOYd5U/edit#gid=1501320853

---
This project was completed as part of [Dr. Tamara Munzner's](https://www.cs.ubc.ca/~tmm/) 2022WT1 CPSC 547 course at UBC.
