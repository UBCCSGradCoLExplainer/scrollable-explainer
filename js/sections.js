/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
  var width = 600; // width of real graph
  var height = 450;
  var tm_height = 600;
  var margin = { top: 20, left: 128, bottom: 40, right: 20 }; // margin between graph and <svg> it appends
  // var SectionNumbers = activateFunctions.length; // how many sections we have in total
  var fadeOutDuration = 500;
  var fontSize = 12;
  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  var lastIndex = -1;
  var activeIndex = 0;

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

  // We will set up elements that are independent of data.
  // @v4 using new scale names
  var xprompt = width / 2 - 80;
  /**
   * Linechart
   */
  var xLineCPIScale = d3.scaleTime().range([0, width]);
  var yLineCPIScale = d3.scaleLinear().range([height, 0]);
  var xAxisLine = d3.axisBottom().scale(xLineCPIScale);
  var xAxisLineFormated = d3
    .axisBottom(xLineCPIScale)
    .tickFormat(function (date) {
      if (d3.timeYear(date) < date) {
        return d3.timeFormat("%b")(date);
      } else {
        return d3.timeFormat("%Y")(date);
      }
    });
  var yAxisLine = d3.axisLeft().scale(yLineCPIScale);
  var lineOpacity = 1.0;
  var lineCollections = {};
  var lineLengthCollections = {};
  var foodLastCPI = 0.101373447;
  var houseLastCPI = 0.082644628;
  var transLastCPI = 0.119732441;

  var allGroup = [
    "FoodMonthCPI",
    "ShelterMonthCPI",
    "HouseholdMonthCPI",
    "ClothingMonthCPI",
    "TransportationMonthCPI",
    "HealthMonthCPI",
    "RecreationMonthCPI"
    // "AlcoholicMonthCPI"
  ];

  var lineGroupLabels = {
    FoodMonthCPI: "food",
    ShelterMonthCPI: "housing",
    HouseholdMonthCPI: "utilities",
    ClothingMonthCPI: "clothing",
    TransportationMonthCPI: "transport",
    HealthMonthCPI: "health",
    RecreationMonthCPI: "recreation"
    // AlcoholicMonthCPI: "alcohol"
  };
  var subCPIColors = d3
    .scaleOrdinal()
    .domain(allGroup)
    .range(d3.schemeCategory10);

  /**
   * Barchart
   */
  var xBarScale = d3.scaleLinear().range([0, width]);
  var yBarScale = d3.scaleBand().range([0, height]).paddingInner(0.1);
  var xAxisBar = d3.axisTop().scale(xBarScale);
  var yAxisBar = d3.axisLeft().scale(yBarScale);
  var barOpacity = 0.5;
  // Color is determined just by the index of the bars
  var barColors = d3
    .scaleOrdinal()
    .domain(["Funding", "col"])
    .range(d3.schemeCategory10);
  // var barColors = { Funding: "steelblue", col: "orangered" };

  /**
   * Scatterplot
   */
  var xScatterScale = d3.scaleLinear().range([0, width]);
  var yScatterScale = d3.scaleLinear().range([height, 0]);
  var xAxisScatter = d3.axisBottom().scale(xScatterScale);
  var yAxisScatter = d3.axisLeft().scale(yScatterScale);
  var scatterR = 4;
  var scatterOpacity = 0.5;
  var program_lst = ["MSc", "PhD", "PhD-Track"];
  var financial_status_lst = [
    "always_enough",
    "enough_after_support",
    "still_not_enough"
  ];
  // Color scale: give me a specie name, I return a color
  var scatterColors = d3
    .scaleOrdinal()
    .domain(financial_status_lst)
    // .range(d3.schemeCategory10);
    .range(["green", "blue", "orangered"]);
  // shape scale: programs
  var scatterShape = d3.scaleOrdinal(d3.symbols);
  var scatterSymbol = d3.symbol();
  var originalTextConent = d3.select(".scatter-final-content").node().innerHTML;

  /**
   * Safeball
   */
  var unsafeNum = 78,
    safeNum = 10,
    adjustR = 50;
  var safeBallPos = {
    unsafecx: width / 2,
    unsafecy: height / 2,
    safecx: width / 2 + unsafeNum + safeNum + adjustR * 2,
    safecy: height / 2
  };

  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];

  // If a section has an update function
  // then it is called while scrolling
  // through the section with the current
  // progress through the section.
  var updateFunctions = [];

  // all the data that will be use
  var dataDict = {};

  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function (selection) {
    selection.each(function () {
      // // create svg and give it a width and height
      // svg = d3.select(this).selectAll("svg").data([phdFundingdata]);
      // var svgE = svg.enter().append("svg");
      // // @v4 use merge to combine enter and existing selection
      // svg = svg.merge(svgE);

      // directly append a new svg without entering data
      svg = d3.select(this).append("svg");

      svg.attr("width", width + margin.left + margin.right);
      svg.attr("height", height + margin.top + margin.bottom);

      // Add a group. this group element will be
      // used to contain all other elements.
      svg.append("g");
      g = svg
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // for test
      g.append("path").attr("class", "forTest");

      // axis
      g.append("g")
        .attr("class", "x topAxis")
        .attr("transform", "translate(0,0)");
      g.append("g")
        .attr("class", "x bottomAxis")
        .attr("transform", `translate(0,${height})`);
      g.append("g")
        .attr("class", "y leftAxis")
        .attr("transform", "translate(0,0)");

      // preprocess data in the dataDict
      dataDict["treeData"] = {
        name: "basic expenses",
        children: [
          { name: "food", value: 512.64 },
          { name: "social", value: 193.84 },
          { name: "health", value: 141.11 },
          { name: "utilities", value: 128.08 },
          { name: "housing", value: 1254.67 },
          { name: "commute", value: 121.06 }
        ]
      };
      dataDict["bcPCI"] = cpiDataPreprocessor(dataDict["bcPCI"]);
      dataDict["PCI22"] = cpi22DataPreprocessor(dataDict["PCI22"]);
      dataDict["PCI22Grouped"] = allGroup.map(function (gpName) {
        return {
          subCPI: gpName,
          values: dataDict["PCI22"].map(function (d) {
            return {
              Time: d.Time,
              value: d[gpName]
            };
          })
        };
      });
      dataDict["phdFunding"] = fundingDataPreprocessor(dataDict["phdFunding"]);
      dataDict["colPrograms"] = colDataPreprocessor(dataDict["colPrograms"]);

      // setup vis components
      setupTitle();
      setupTreemap();
      setupLineVis();
      setupScatterVis();
      setupBarVis(); // can add more data as multiple parameters. See the original design
      // console.log(dataDict);
      setupSafeBalls();
      // setupMisc();
      setupSections();
    });
  };

  function setupTitle() {
    g.append("text")
      .attr("class", "title mainTitle")
      .attr("x", width / 5 + 150)
      .attr("y", height / 5)
      .text("Grad student life:");

    g.append("text")
      .attr("class", "title mainTitle")
      .attr("x", width / 5 + 150)
      .attr("y", height / 5 + 64)
      .text(" Cost of Living @UBC")
      .style("font-size", 50);

    g.append("text")
      .attr("class", "title quote")
      .attr("x", width / 5 + 150)
      .attr("y", height / 5 + 100)
      .text(
        `"I am more stressed now about my financial situation than during my 
        undergrad when I had to take out loans."`
      );

    g.append("text")
      .attr("class", "title quote")
      .attr("x", width / 5 + 100)
      .attr("y", height / 5 + 116)
      .text(
        `"The cost of living in Vancouver is unmanageable." - Quote from student`
      );

    // g.append("text")
    //   .attr("class", "title subTitle")
    //   .attr("x", width / 3 + 67)
    //   .attr("y", height / 2 + 32)
    //   .text("Scroll down to learn more!")
    //   .style("font-size", 40);

    g.append("svg:image")
      .attr("class", "title ")
      .attr("x", width / 6 - 110)
      .attr("y", height - 230)
      // .attr("width", 20)
      .attr("height", 180)
      .attr("xlink:href", "../assets/vancouver.png");

    g.selectAll(".title").attr("opacity", 0);

    // scroll down prompt
    g.append("polygon")
      .attr("class", "title prompt")
      .attr("points", "0 0, 30 45, 60 0")
      .attr("stroke", "grey")
      .attr("fill", "grey")
      .attr("transform", `translate(${xprompt}, ${height - 100})`) //is there a way to center this? - Dev
      .attr("opacity", 0);
  }

  /**
   * setupTreemap - creates initial elements for treemap
   * sections of the visualization.
   *
   */
  var setupTreemap = function () {
    var treedata = dataDict["treeData"];

    // Give the data to this cluster layout:
    var root = d3.hierarchy(treedata).sum(function (d) {
      return d.value;
    }); // Here the size of each leave is given in the 'value' field in input data

    var treeg = g
      .append("g")
      .attr("class", "treemapG")
      .attr("transform", "translate(100, 0)");
    // Then d3.treemap computes the position of each element of the hierarchy
    d3.treemap().size([height, height]).padding(2)(root);

    // use this information to add rectangles:

    var treeColors = d3
      .scaleLinear()
      .domain([120, 1260])
      .range(["white", "steelblue"]);
    treeg
      .selectAll("treeRect")
      .data(root.leaves())
      .enter()
      .append("rect")
      .attr("class", "treeRect")
      .attr("x", function (d) {
        return d.x0;
      })
      .attr("y", function (d) {
        return d.y0;
      })
      .attr("width", function (d) {
        return d.x1 - d.x0;
      })
      .attr("height", function (d) {
        return d.y1 - d.y0;
      })
      .style("stroke", "black")
      .style("fill", function (d) {
        return treeColors(d.data.value);
      });
    // .style("fill", function (d) {
    //   // console.log((d.data.value / 2351.4) * 100);
    //   // Saturation % based on budget proportion
    //   return `hsl(212, ${(d.data.value / 2351.4) * 100}%, 32%)`;
    // });

    // and to add the text labels
    treeg
      .selectAll("treeText")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("class", "treeText")
      .attr("x", function (d) {
        return d.x0 + 5;
      }) // +5 to adjust position (more right)
      .attr("y", function (d) {
        return d.y0 + 20;
      }) // +20 to adjust position (lower)
      .text(function (d) {
        return `${((d.data.value / 2351.4) * 100).toFixed(
          1
        )}% — ${d.data.name}: $${d.data.value}`;
      })
      .attr("font-size", "1.2rem")
      .attr("font-weight", "400")
      .attr("fill", "black");

    treeg
      .selectAll("treeText")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("class", "treeText treemap-total")
      .text(`Total Monthly Basic Expenses: $2351.40`);

    // var tooltip = d3
    //   .select("#vis")
    //   .append("div")
    //   .style("position", "absolute")
    //   .style("visibility", "hidden")
    //   .text("I'm a !");

    // treeg
    //   .selectAll("treeRect")
    //   .data(root.leaves())
    //   .enter()
    //   .on("mouseover", function (d) {
    //     return tooltip.style("visibility", "visible");
    //   })
    //   .on("mousemove", function (d) {
    //     return tooltip
    //       .style("top", event.pageY - 800 + "px")
    //       .style("left", event.pageX - 800 + "px");
    //   })
    //   .on("mouseout", function (d) {
    //     return tooltip.style("visibility", "hidden");
    //   });

    // .attr("x", width / 5 + 150)
    // .attr("y", height)

    // treeg
    //   .selectAll(".treemapG")
    //   .append("image")
    //   .attr("class", "treemap_legend")
    //   .attr("href", "../assets/tm_colourlegend.svg");

    // // add legend for the treemap
    // treeg
    //   .append("g")
    //   .attr("class", "treeLegend")
    //   .attr("transform", `translate(${100 + height}, 0)`)
    //   .attr("width", width)
    //   .attr("height", height)
    //   .style("fill", "url(#linear-gradient)");

    // hide everything
    treeg.selectAll(".treeRect, .treeText").attr("opacity", 0);
  };

  /**
   * setupLineVis - creates initial elements for Line
   * sections of the visualization.
   *
   */
  var setupLineVis = function () {
    var bcPCIdata = dataDict["bcPCI"];

    // append equation
    var CPIEquationg = g.append("g").attr("class", "CPIexplain");
    CPIEquationg.append("image")
      .attr("id", "CPIequation")
      .attr("href", "/assets/CPIequation.svg")
      .attr("height", height)
      .attr("width", width);
    CPIEquationg.attr("opacity", 0);

    // set the line scale's domain
    xLineCPIScale.domain(
      d3.extent(bcPCIdata, function (d) {
        return d.Time;
      })
    );

    var allItemsAccessor = function (d) {
      return d.allItems;
    };
    yLineCPIScale.domain([
      d3.min(bcPCIdata, allItemsAccessor),
      d3.max(bcPCIdata, allItemsAccessor)
    ]);

    // axis: leave for activate function
    // // call the axis and hide them
    // g.select(".x.bottomAxis").call(xAxisLine).style("opacity", 0);
    // g.select(".y.leftAxis").call(yAxisLine).style("opacity", 0);

    // Create the line
    var LineAllItems = d3
      .line()
      .curve(d3.curveCatmullRom)
      .x(function (d) {
        return xLineCPIScale(d.Time);
      })
      .y(function (d) {
        return yLineCPIScale(d.allItems);
      });

    lineCollections["allItems"] = LineAllItems;
    lineLengthCollections["allItems"] = length(LineAllItems(bcPCIdata));

    // Add a clipPath: everything out of this area won't be drawn.
    var clip = g
      .append("defs")
      .append("g:clipPath")
      .attr("id", "clip")
      .append("g:rect")
      .attr("width", width)
      .attr("height", tm_height)
      .attr("x", 0)
      .attr("y", 0);

    // Add the line
    g.append("path")
      .attr("class", "CPILine")
      .attr("clip-path", "url(#clip)")
      .datum(bcPCIdata)
      // .data([bcPCIdata])
      .attr("fill", "none")
      // .attr("stroke", "url(#gradientYear)")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", LineAllItems)
      .attr("opacity", lineOpacity)
      .attr("stroke-dasharray", `0,${lineLengthCollections["allItems"]}`);
    // .attr("stroke-dashoffset", lCPIMultiyearLine).attr(
    //   "stroke-dasharray",
    //   lCPIMultiyearLine
    // );

    // also add the multiItems CPI lines
    g.selectAll(".multiCPILine")
      .data(dataDict["PCI22Grouped"])
      .enter()
      .append("g")
      .append("path")
      .attr("class", function (d) {
        return "multiCPILine " + d.subCPI;
      })
      .attr("stroke", function (d) {
        return subCPIColors(d.subCPI);
      })
      .style("stroke-width", 2)
      .style("fill", "none")
      .attr("opacity", 0);

    // Add a label at the end of each line
    g.selectAll(".multiCPILineLabels")
      .data(dataDict["PCI22Grouped"])
      .enter()
      .append("g")
      .append("text")
      .attr("class", function (d) {
        return "multiCPILineLabels " + d.subCPI;
      })
      .datum(function (d) {
        return {
          subCPI: d.subCPI,
          value: d.values[d.values.length - 1]
          // textPosValue: d.values[d.values.length - 2].value
        };
      }) // keep only the last value of each time series
      .text(function (d) {
        return lineGroupLabels[d.subCPI];
      })
      .attr("fill", function (d) {
        return subCPIColors(d.subCPI);
      })
      .style("font-size", fontSize)
      .attr("opacity", 0);

    // add the BIG legend
    g.append("g")
      .attr("class", "CPILegend")
      .append("text")
      .attr("class", "MainLegend")
      .attr("x", 20)
      .attr("y", 80)
      // .text("Consumer Price Index (CPI)")
      .style("font-size", 40)
      .attr("fill", "grey")
      .attr("opacity", 0);

    g.select(".CPILegend")
      .append("text")
      .attr("class", "SubLegend")
      .attr("x", 25)
      .attr("y", 110)
      .style("font-size", 20)
      .attr("fill", "#B2BEB5")
      .attr("opacity", 0);
  };

  /**
   * setupBarVis - creates initial elements for Bar
   * sections of the visualization.
   *
   */
  var setupBarVis = function () {
    // perform some preprocessing on raw data
    var phdFundingdata = dataDict["phdFunding"];

    var maxFigure = Math.max(
      -d3.min(phdFundingdata, function (d) {
        return d.Yearly_col_kCAD_neg;
      }),
      d3.max(phdFundingdata, function (d) {
        return d.Yearly_funding_kCAD;
      })
    );
    // set the bar scale's domain
    xBarScale.domain([-maxFigure, maxFigure]);
    // xBarScale.domain([
    //   0,
    //   d3.max(phdFundingdata, function (d) {
    //     return d.Yearly_funding_kCAD;
    //   })
    // ]);
    yBarScale.domain(
      phdFundingdata.map(function (d) {
        return d.University;
      })
    );

    g.append("text")
      .attr("class", "yBarLabel")
      .attr("x", width - 10)
      .attr("y", 20)
      .attr("text-anchor", "start")
      //   .attr("font-family", "calibri")
      .style("fill", "black")
      .style("font-size", 10)
      .text("kCAD")
      .attr("opacity", 0);

    g.append("g")
      .attr("class", "colAndFundingLabel")
      .append("text")
      .attr("x", xBarScale(0) + 5)
      .attr("y", 20)
      .attr("text-anchor", "start")
      .style("fill", "black")
      .style("font-size", 10)
      .text("Funding");
    g.select(".colAndFundingLabel")
      .append("text")
      .attr("x", xBarScale(0) - 5)
      .attr("y", 20)
      .attr("text-anchor", "end")
      .style("fill", "black")
      .style("font-size", 10)
      .text("Cost of Living");
    g.select(".colAndFundingLabel").attr("opacity", 0);

    // axis: leave for activate function
    // // call the axis and hide them
    // g.select(".x.topAxis").call(xAxisBar).style("opacity", 0);
    // g.select(".y.leftAxis").call(yAxisBar).style("opacity", 0);

    // @v4 Using .merge here to ensure
    // new and old data have same attrs applied
    var bars = g.selectAll(".fundingBar").data(phdFundingdata);
    var barsE = bars
      .enter()
      .append("rect")
      .attr("class", "fundingBar")
      .classed("highlightBar", function (d) {
        return d.University === "University of British Columbia" ? true : false;
      });
    bars = bars
      .merge(barsE)
      .attr("x", xBarScale(0))
      // .attr("x", 0)
      .attr("y", function (d) {
        return yBarScale(d.University);
      })
      .attr("width", 0) // first set to 0
      // .attr("fill", function (d) {
      //   return d.University === "University of British Columbia"
      //     ? "gold"
      //     : barColors["Funding"];
      // })
      .attr("fill", barColors("Funding"))
      .attr("height", yBarScale.bandwidth())
      .attr("opacity", barOpacity);

    var reverseBars = g.selectAll(".colBar").data(phdFundingdata);
    var reverseBarsE = reverseBars
      .enter()
      .append("rect")
      .attr("class", "colBar")
      .classed("highlightBar", function (d) {
        return d.University === "University of British Columbia" ? true : false;
      });
    reverseBars = reverseBars
      .merge(reverseBarsE)
      // .attr("x", xBarScale(0))
      .attr("x", function (d) {
        return xBarScale(0);
      })
      // .attr("x", function (d) {
      //   return xBarScale(d.Yearly_funding_kCAD);
      // })
      .attr("y", function (d) {
        return yBarScale(d.University);
      })
      .attr("width", 0) // first set to 0
      .attr("fill", barColors("col"))
      // .attr("fill", function (d) {
      //   return d.University === "University of British Columbia"
      //     ? "red"
      //     : barColors["col"];
      // })
      .attr("height", yBarScale.bandwidth())
      .attr("opacity", barOpacity);

    g.selectAll(".barText")
      .data(dataDict["phdFunding"])
      .enter()
      .append("text")
      .attr("class", "barText")
      .text(function (d) {
        return d.University;
      })
      .attr("x", 0)
      .attr("dx", 15)
      .attr("y", function (d) {
        return yBarScale(d.University);
      })
      .attr("dy", yBarScale.bandwidth() / 1.4)
      .style("font-size", fontSize)
      .attr("fill", "black")
      .attr("opacity", 0);
  };

  /**
   * setupScatterVis - creates initial elements for Scatter
   * sections of the visualization.
   *
   */
  var setupScatterVis = function () {
    // perform some preprocessing on raw data
    var coldata = dataDict["colPrograms"];

    // set the scale's domain
    var minBasicExpenses = d3.min(coldata, function (d) {
        return d.basic_expenses;
      }),
      maxBasicExpenses = d3.max(coldata, function (d) {
        return d.basic_expenses;
      }),
      minSupportedIncome = d3.min(coldata, function (d) {
        return d.supported_income;
      }),
      maxSupportedIncome = d3.max(coldata, function (d) {
        return d.supported_income;
      });
    // minForBothAxis = Math.min(minBasicExpenses, minSupportedIncome),
    // maxForBothAxis = Math.max(maxBasicExpenses, maxSupportedIncome);

    var paddingForAxis = 200;
    xScatterScale.domain([
      minBasicExpenses - paddingForAxis,
      maxBasicExpenses + paddingForAxis
    ]);

    yScatterScale.domain([
      minSupportedIncome - paddingForAxis,
      maxSupportedIncome + paddingForAxis
    ]);

    // axis -- leave for activate function (`showAxis`)

    // axis label
    g.append("g")
      .attr("class", "scatterAxisLabel")
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", width + margin.right)
      .attr("y", height + margin.bottom - 5)
      .text("Expense (Monthly)")
      .style("font-size", 11);

    g.selectAll(".scatterAxisLabel")
      .append("text")
      .attr("text-anchor", "end")
      // .attr("transform", "rotate(-90)")
      .attr("x", 70)
      .attr("y", -10)
      .text("Income (Monthly)")
      .style("font-size", 11);

    // hide the group
    g.selectAll(".scatterAxisLabel").attr("opacity", 0);

    // add caption in plot
    g.append("g")
      .attr("class", "scatterCaption")
      .append("text")
      .attr("x", xScatterScale(3500))
      .attr("y", yScatterScale(8000))
      .html("47.5%")
      .attr("fill", "red")
      .style("font-size", 40);
    g.select(".scatterCaption")
      .append("text")
      .attr("x", xScatterScale(3000))
      .attr("y", yScatterScale(8000 - 600))
      .html("cannot offset the basic expense")
      .style("font-size", 20);
    // first hide it
    g.selectAll(".scatterCaption").attr("opacity", 0);

    // add the auxiliary line
    g.append("g")
      .attr("id", "xyauxiliary")
      .append("line")
      .attr("x1", xScatterScale(minBasicExpenses - paddingForAxis))
      .attr("y1", yScatterScale(minBasicExpenses - paddingForAxis))
      .attr("x2", xScatterScale(maxBasicExpenses + paddingForAxis))
      .attr("y2", yScatterScale(maxBasicExpenses + paddingForAxis))
      .attr("stroke", "grey")
      .attr("opacity", 0.8)
      .attr("stroke-dasharray", "3,2");

    // add label for it
    g.select("#xyauxiliary")
      .append("text")
      .attr("x", xScatterScale(maxBasicExpenses + paddingForAxis))
      .attr("y", yScatterScale(maxBasicExpenses + paddingForAxis))
      .text("y=x")
      .style("font-size", fontSize);

    g.selectAll("#xyauxiliary").attr("opacity", 0);

    // Add dots
    g.append("g")
      .selectAll("originalDot")
      .data(coldata)
      .enter()
      .append("path")
      .attr("class", function (d) {
        return "originalDot " + d.financial_status + " " + d.program;
      })
      .attr("d", (d) => scatterSymbol.type(scatterShape(d.program)).size(75)())
      .attr("transform", function (d) {
        return `translate(${xScatterScale(
          d.basic_expenses
        )},${yScatterScale(d.basic_income)})`;
      })
      .style("stroke", "black")
      .style("fill", "grey")
      .attr("opacity", 0);

    g.append("g")
      .selectAll("afterDot")
      .data(coldata)
      .enter()
      .append("path")
      .attr("class", function (d) {
        return "afterDot " + d.financial_status + " " + d.program;
      })
      .attr("d", (d) => scatterSymbol.type(scatterShape(d.program)).size(75)())
      .attr("transform", function (d) {
        return `translate(${xScatterScale(
          d.basic_expenses
        )},${yScatterScale(d.supported_income)})`;
      })
      .style("stroke", "black")
      .style("fill", function (d) {
        return scatterColors(d.financial_status);
      })
      .attr("opacity", 0);

    // connect line
    g.append("g")
      .selectAll("connectLine")
      .data(coldata)
      .enter()
      .append("line")
      .attr("class", function (d) {
        return "connectLine " + d.program;
      })
      .attr("x2", function (d) {
        return xScatterScale(d.basic_expenses);
      })
      .attr("y2", function (d) {
        return yScatterScale(d.basic_income);
      })
      .attr("x1", function (d) {
        return xScatterScale(d.basic_expenses);
      })
      .attr("y1", function (d) {
        return yScatterScale(d.basic_income);
      })
      .attr("stroke", "grey")
      .attr("stroke-dasharray", "2,2")
      .attr("opacity", 0.8); // it's ok, because it relies on change in `y2`

    // Add shape legend
    g.append("g")
      .attr("class", "shapeLegendScatter")
      .selectAll(".shapeLegendText")
      .data(program_lst)
      .enter()
      .append("text")
      .attr("x", 25)
      .attr("y", function (d, i) {
        return 10 + i * 15;
      })
      .text(function (d) {
        return d;
      })
      .style("fill", "black")
      .style("font-size", 13);

    g.select("g.shapeLegendScatter")
      .selectAll(".shapeLegendShape")
      .data(program_lst)
      .enter()
      .append("path")
      .attr("d", (d) => scatterSymbol.type(scatterShape(d)).size(50)())
      .attr("transform", function (d, i) {
        return `translate(15, ${5 + i * 15})`;
      })
      .style("fill", "grey");

    g.selectAll("g.shapeLegendScatter").attr("opacity", 0);

    // Add color legend
    g.append("g")
      .attr("class", "colorLegend")
      .selectAll(".colorLegendText")
      .data(financial_status_lst)
      .enter()
      .append("text")
      .attr("class", "colorLegendText")
      .attr("x", 25)
      .attr("y", function (d, i) {
        return 3 * 15 + 10 + i * 15;
      })
      .text(function (d) {
        return d;
      })
      .style("fill", "black")
      .style("font-size", 13);

    g.select("g.colorLegend")
      .selectAll(".colorLegendShape")
      .data(financial_status_lst)
      .enter()
      .append("circle")
      .attr("class", "colorLegendShape")
      .attr("r", 4)
      .style("fill", function (d) {
        return scatterColors(d);
      })
      .attr("transform", function (d, i) {
        return `translate(15, ${3 * 15 + 5 + i * 15})`;
      })
      .attr("opacity", scatterOpacity);

    g.selectAll(".colorLegend").transition().attr("opacity", 0);

    // selectList
    d3.select("#vis").append("select").attr("id", "scatterSelectButton");
    // add the options to the button
    var buttonOptions = [...program_lst];
    buttonOptions.push("All");
    d3.select("#scatterSelectButton")
      .selectAll("scatterOptions")
      .data(buttonOptions)
      .enter()
      .append("option")
      .attr("class", "scatterOptions")
      .text(function (d) {
        return d;
      }) // text showed in the menu
      .attr("value", function (d) {
        return d;
      }) // corresponding value returned by the button
      .attr("selected", function (d) {
        if (d === "All") {
          return true;
        } else {
          return false;
        }
      });

    d3.select("#scatterSelectButton").attr("hidden", "hidden");
  };

  /**
   * setupSafeBalls - creates initial elements for SafeBalls
   * sections of the visualization.
   *
   */
  var setupSafeBalls = function () {
    g.append("g")
      .attr("class", "safeBalls")
      .append("circle")
      .attr("class", "unsafeBall")
      .attr("cx", safeBallPos.unsafecx)
      .attr("cy", safeBallPos.unsafecy)
      .attr("r", 0)
      .attr("fill", "orangered")
      .attr("opacity", 0.7);

    g.selectAll(".safeBalls")
      .append("circle")
      .attr("class", "safeBall")
      .attr("cx", safeBallPos.safecx)
      .attr("cy", safeBallPos.safecy)
      .attr("r", 0)
      .attr("fill", "steelblue")
      .attr("opacity", 0.7);

    // captions
    g.selectAll(".safeBalls")
      .append("g")
      .attr("class", "safeBalls captions")
      .append("text")
      .attr("x", safeBallPos.unsafecx)
      .attr("y", safeBallPos.unsafecy)
      .attr("fill", "white")
      .style("font-size", 40)
      .attr("text-anchor", "middle")
      .text(`${((unsafeNum * 100) / (unsafeNum + safeNum)).toFixed(1)}%`);
    g.selectAll(".safeBalls.captions")
      .append("text")
      .attr("x", safeBallPos.unsafecx)
      .attr("y", safeBallPos.unsafecy + 25)
      .attr("fill", "white")
      .style("font-size", 20)
      .attr("text-anchor", "middle")
      .text("feel unsafe");
    g.selectAll(".safeBalls.captions")
      .append("text")
      .attr("x", safeBallPos.unsafecx)
      .attr("y", safeBallPos.unsafecy + 25 + 20)
      .attr("fill", "white")
      .style("font-size", 15)
      .attr("text-anchor", "middle")
      .text("in current stipend amount");
    g.selectAll(".safeBalls.captions")
      .append("text")
      .attr("x", safeBallPos.safecx)
      .attr("y", safeBallPos.safecy)
      .attr("fill", "white")
      .style("font-size", 20)
      .attr("text-anchor", "middle")
      .text(`${((safeNum * 100) / (unsafeNum + safeNum)).toFixed(1)}%`);
    g.selectAll(".safeBalls.captions")
      .append("text")
      .attr("x", safeBallPos.safecx)
      .attr("y", safeBallPos.safecy + 25)
      .attr("fill", "white")
      .style("font-size", 15)
      .attr("text-anchor", "middle")
      .text("feel safe");
    g.selectAll(".safeBalls.captions").attr("opacity", 0);
  };

  /**
   * setupSafeBalls - setup others, like image.
   *
   */
  var setupMisc = function () {
    d3.select("#vis")
      .append("a")
      .attr("id", "unionLogo")
      .attr("href", "https://organizeubc.cupe.ca/sign-a-card/")
      .attr("target", "_blank")
      .append("svg")
      .attr("height", height)
      .attr("width", width)
      .append("image")
      .attr(
        "href",
        "https://organizeubc.cupe.ca/wp-content/uploads/sites/212/2022/10/UBC-Logo_Final.png"
      )
      .attr("height", height)
      .attr("width", width);
    d3.select("#unionLogo svg image").attr("opacity", 0);
    d3.select("#unionLogo").style("display", "none");
  };
  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  var setupSections = function () {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = showTitle;
    activateFunctions[1] = showTreeMap;
    activateFunctions[2] = explainCPI;
    activateFunctions[3] = showCPILine;
    activateFunctions[4] = show12MonthCPILine;
    activateFunctions[5] = showMultiLines;
    activateFunctions[6] = highLightHouseLines;
    activateFunctions[7] = highLightFoodTransLines;
    activateFunctions[8] = showScatter;
    activateFunctions[9] = highLightScatter;
    activateFunctions[10] = afterSupportScatter;
    activateFunctions[11] = showSafeBalls;
    activateFunctions[12] = showLollipop;
    activateFunctions[13] = showDivergingBar;
    activateFunctions[14] = showOverlappingBar;
    activateFunctions[15] = reOrderBar;
    activateFunctions[16] = closingTitle;

    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for (var i = 0; i < activateFunctions.length; i++) {
      updateFunctions[i] = function () {};
    }
    updateFunctions[11] = updateSafeBalls;
  };

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

  /**
   * showTitle - initial title
   *
   * hides: treemap
   * (no previous step to hide)
   * shows:
   *
   */
  function showTitle() {
    // hide next
    // todo: hide treemap
    g.selectAll(".treeRect, .treeText")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // show new
    g.selectAll(".title")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);

    var prompt = g.selectAll(".title.prompt");
    prompt
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1)
      .on("end", propmtMovement);
    // prompt
    //   .transition()
    //   .duration(fadeOutDuration)
    //   .attr("transform", `translate(50, ${height - 50 + 30})`)
    //   .transition()
    //   .duration(fadeOutDuration)
    //   .attr("transform", `translate(50, ${height - 50})`);
    function propmtMovement() {
      // console.log("propmtMovement is called");
      prompt
        .transition()
        .duration(fadeOutDuration)
        .attr("transform", `translate(${xprompt}, ${height - 50 + 30})`)
        .transition()
        .duration(fadeOutDuration)
        .attr("transform", `translate(${xprompt}, ${height - 50})`)
        .on("end", propmtMovement);
    }
  }

  /**
   * showTreeMap - Treemap
   *
   * hides previous: Title
   * hides next: zoom out
   * shows now: treemap
   *
   */
  function showTreeMap() {
    // hide previous
    g.selectAll(".title")
      .transition("hideTitle")
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // hide next
    d3.select(".CPIexplain")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // show now
    // todo: show treemap
    g.selectAll(".treeRect, .treeText")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);
  }

  /**
   * zoomTreeMap - Treemap
   *
   * hides previous: Title
   * hides next: linechart
   * shows now: treemap
   *
   */
  function zoomTreeMap() {
    // hide previous+show now
    // todo: zoom in
    // hide next
  }

  function explainCPI() {
    // hide previous
    g.selectAll(".treeRect, .treeText")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // hide next
    hideAxis("bottomAxis", "leftAxis");
    g.selectAll(".CPILegend .MainLegend, .CPILegend .SubLegend")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".CPILine")
      .transition()
      .duration(fadeOutDuration)
      .attr("stroke-dasharray", `0,${lineLengthCollections["allItems"]}`);

    // show now
    d3.select(".CPIexplain")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);
  }
  /**
   * showCPILine - linechart
   *
   * hides previous: CPIexplain
   * hides next: legend
   * shows now: linechart
   *
   */
  function showCPILine() {
    // hide previous
    d3.select(".CPIexplain")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // hide next -- by rebound the "d"

    // show now
    g.selectAll(".CPILegend .MainLegend")
      .transition()
      .duration(fadeOutDuration)
      .text("Consumer Price Index (CPI)")
      .attr("opacity", 1);

    g.selectAll(".CPILegend .SubLegend")
      .transition()
      .duration(fadeOutDuration)
      .text("An indicator of inflation. Base period is 2002")
      .attr("opacity", 1);

    // MUST reset the line scale's domain (to hide previous and following)
    xLineCPIScale.domain(
      d3.extent(dataDict["bcPCI"], function (d) {
        return d.Time;
      })
    );

    var allItemsAccessor = function (d) {
      return d.allItems;
    };
    yLineCPIScale.domain([
      d3.min(dataDict["bcPCI"], allItemsAccessor),
      d3.max(dataDict["bcPCI"], allItemsAccessor)
    ]);

    showAxis(xAxisLine, "bottomAxis", yAxisLine, "leftAxis");

    // console.log(lineCollections);
    g.selectAll(".CPILine")
      // .attr("stroke-dasharray", `0,${lineLengthCollections["allItems"]}`)
      .transition()
      .duration(fadeOutDuration + 200)
      .ease(d3.easeLinear)
      .delay(300)
      .attr("opacity", lineOpacity)
      .attr("d", lineCollections["allItems"])
      // .attr("stroke-dasharray", `${this.node().getTotalLength()},0`);
      .attr("stroke-dasharray", `${lineLengthCollections["allItems"]},0`);
  }

  /**
   * show12MonthCPILine - linechart
   *
   * hides previous: CPILine (y axis, label)
   * hides next:
   * shows now: linechart
   *
   */
  function show12MonthCPILine() {
    // hide previous

    // hide next
    g.selectAll(".multiCPILine")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".multiCPILineLabels")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // show now

    // show the legend
    g.selectAll(".CPILegend .MainLegend")
      .transition()
      .duration(fadeOutDuration)
      .text("12-month % change")
      .attr("opacity", 1);
    g.selectAll(".CPILegend .SubLegend")
      .transition()
      .duration(fadeOutDuration)
      .text("Compared to last year")
      .attr("opacity", 1);

    // MUST reset the line scale's domain (to hide previous and following)
    xLineCPIScale.domain(
      d3.extent(dataDict["bcPCI"], function (d) {
        return d.Time;
      })
    );

    yLineCPIScale.domain([
      d3.min(dataDict["bcPCI"], function (d) {
        return d.MonthCPI;
      }),
      d3.max(dataDict["bcPCI"], function (d) {
        return d.MonthCPI;
      })
    ]);
    showAxis(xAxisLine, "bottomAxis", yAxisLine, "leftAxis"); // update

    var LineAllItemsMonthCPI = d3
      .line()
      .curve(d3.curveCatmullRom)
      .x(function (d) {
        return xLineCPIScale(d.Time);
      })
      .y(function (d) {
        return yLineCPIScale(d.MonthCPI);
      });
    lineCollections["allItemsMonth"] = LineAllItemsMonthCPI;
    lineLengthCollections["allItemsMonth"] = length(
      LineAllItemsMonthCPI(dataDict["bcPCI"])
    );

    // Add the line
    g.select(".CPILine")
      .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .delay(300)
      .attr("d", lineCollections["allItemsMonth"])
      .attr("stroke-dasharray", `${lineLengthCollections["allItemsMonth"]},0`)
      .attr("opacity", lineOpacity);
  }

  /**
   * showMultiLines - linechart
   *
   * hides previous: CPILine (x axis, label)
   * hides next: revert highligher
   * shows now: linechart
   *
   */
  function showMultiLines() {
    // hide next: revert highligher
    g.selectAll(".HLine")
      .transition()
      .duration(fadeOutDuration)
      .attr("x2", width);
    g.selectAll(".HLineLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // show now

    // legend
    g.selectAll(".CPILegend")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);

    xLineCPIScale.domain(
      d3.extent(dataDict["PCI22"], function (d) {
        return d.Time;
      })
    );

    yLineCPIScale.domain([-0.05, 0.17]);

    showAxis(xAxisLineFormated, "bottomAxis", yAxisLine, "leftAxis"); // update

    // redraw line
    var LineAllItems22CPI = d3
      .line()
      .curve(d3.curveCatmullRom)
      .x(function (d) {
        return xLineCPIScale(d.Time);
      })
      .y(function (d) {
        return yLineCPIScale(d.MonthCPI);
      });
    lineCollections["allItems22"] = LineAllItems22CPI;
    lineLengthCollections["allItems22"] = length(
      LineAllItems22CPI(dataDict["bcPCI"])
    );

    // Add the re-drawn line
    g.select(".CPILine")
      .transition()
      .duration(fadeOutDuration + 500)
      .ease(d3.easeQuadInOut)
      .attr("d", lineCollections["allItems22"])
      .attr("stroke-dasharray", `${lineLengthCollections["allItems22"]},0`)
      // .transition()
      // .duration(300)
      // .attr("opacity", 0.5)
      .attr("stroke-dasharray", `10,5`);

    // Create grouped line (in another layer)
    // must be down here AFTER we rescale the axis
    var LineMultiCPIs = d3
      .line()
      .curve(d3.curveCatmullRom)
      .x(function (d) {
        return xLineCPIScale(+d.Time);
      })
      .y(function (d) {
        return yLineCPIScale(+d.value);
      });
    lineCollections["multi"] = LineMultiCPIs;
    lineLengthCollections["multi"] = length(
      LineMultiCPIs(dataDict["PCI22Grouped"].values)
    );

    // add to the graph
    g.selectAll(".multiCPILine")
      .transition()
      .duration(fadeOutDuration + 500)
      // .delay(600)
      .attr("d", function (d) {
        return lineCollections["multi"](d.values);
      })
      .attr("opacity", lineOpacity);

    g.selectAll(".multiCPILineLabels")
      .attr("transform", function (d) {
        return `translate(${xLineCPIScale(d.value.Time) - 40},
          ${yLineCPIScale(d.value.value) + 10})`;
      })
      .transition()
      .duration(fadeOutDuration + 500)
      // .delay(600)
      .attr("opacity", 1);
  }

  /**
   * highLightLines - linechart
   *
   * hides previous: CPILine (label), legend
   * hides next:
   * shows now: linechart
   *
   */
  function highLightHouseLines() {
    // hide previous
    // legend
    g.selectAll(".CPILegend")
      .transition()
      .duration(fadeOutDuration - 100)
      .attr("opacity", 0);

    // fade some lines and labels
    g.selectAll(".multiCPILine")
      .transition()
      .duration(fadeOutDuration - 100)
      .attr("opacity", 0.2);
    g.selectAll(".multiCPILineLabels")
      .transition()
      .duration(fadeOutDuration - 100)
      .attr("opacity", 0.2);
    g.selectAll(".CPILine")
      .transition()
      .duration(fadeOutDuration - 100)
      .attr("opacity", 0.2);

    // hide next: food and transport highlighter
    subCPIHighlightHide("FoodMonthCPI", "food");
    subCPIHighlightHide("TransportationMonthCPI", "transport");

    // shows now
    subCPIHighlight("ShelterMonthCPI", "house", houseLastCPI);
  }

  function highLightFoodTransLines() {
    // hide previous: house highlight
    subCPIHighlightHide("ShelterMonthCPI", "house");

    // hide next: scatterplot
    g.selectAll(".originalDot")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll("#xyauxiliary")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".scatterAxisLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll("g.shapeLegendScatter")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    // redraw some parts
    showAxis(xAxisLine, "bottomAxis", yAxisLine, "leftAxis"); // update
    g.selectAll(".multiCPILine")
      .transition()
      .duration(fadeOutDuration - 100)
      .attr("opacity", 0.2);
    g.selectAll(".multiCPILineLabels")
      .transition()
      .duration(fadeOutDuration - 100)
      .attr("opacity", 0.2);
    g.selectAll(".CPILine")
      .transition()
      .duration(fadeOutDuration - 100)
      .attr("opacity", 0.2);

    // shows now
    showAxis(xAxisLineFormated, "bottomAxis", yAxisLine, "leftAxis"); // update
    subCPIHighlight("FoodMonthCPI", "food", foodLastCPI);
    subCPIHighlight("TransportationMonthCPI", "transport", transLastCPI);
  }

  /**
   * showScatter - scatterplot
   *
   * hides previous: lineChart (axis, lines, highlighter)
   * hides next:
   * shows now: scatter
   *
   */
  function showScatter() {
    // hide previous
    // switch the axis
    hideAxis("topAxis");

    // hide lines
    g.selectAll(".multiCPILine")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".multiCPILineLabels")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".CPILine")
      .transition()
      .duration(fadeOutDuration)
      .ease(d3.easeLinear)
      .attr("stroke-dasharray", `0,${lineLengthCollections["allItemsMonth"]}`);

    // hide highlighters
    g.selectAll(".HLine")
      .transition()
      .duration(fadeOutDuration)
      .attr("x2", width);
    g.selectAll(".HLineLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // hide next
    // captions
    g.selectAll(".scatterCaption")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // show now
    showAxis(xAxisScatter, "bottomAxis", yAxisScatter, "leftAxis");
    g.selectAll(".scatterAxisLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);
    g.selectAll(".originalDot")
      .transition()
      .duration(fadeOutDuration)
      .attr("transform", function (d) {
        return `translate(${xScatterScale(
          d.basic_expenses
        )},${yScatterScale(d.basic_income)})`;
      })
      .style("stroke", "black")
      .style("fill", "grey")
      .attr("opacity", scatterOpacity);
    g.selectAll("#xyauxiliary")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0.8);

    g.selectAll(".shapeLegendScatter")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);
  }

  /**
   * highLightScatter - scatterplot
   *
   * hides previous:
   * hides next: afterDot
   * shows now: highlighter+caption
   *
   */
  function highLightScatter() {
    // hide next
    g.selectAll(".connectLine")
      .transition()
      .duration(fadeOutDuration)
      .attr("y1", function (d) {
        return yScatterScale(d.basic_income);
      });
    g.selectAll(".afterDot")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".originalDot")
      .transition()
      .duration(fadeOutDuration)
      .attr("transform", function (d) {
        return `translate(${xScatterScale(
          d.basic_expenses
        )},${yScatterScale(d.basic_income)})`;
      })
      .style("stroke", "black")
      .style("fill", "grey")
      .attr("opacity", scatterOpacity);

    g.selectAll(".colorLegend")
      .transition("hideColorLegend")
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    d3.select("#scatterSelectButton")
      .transition()
      .duration(fadeOutDuration)
      .attr("hidden", "hidden");

    // show now
    g.selectAll(".scatterCaption")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);

    g.selectAll(
      ".originalDot.still_not_enough, .originalDot.enough_after_support"
    )
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", Math.min(1, scatterOpacity + 0.2))
      .style("stroke", "black")
      .style("fill", "red");
  }

  /**
   * afterSupportScatter - scatterplot
   *
   * hides previous: highlight scatter
   * hides next: safeBall
   * shows now: afterdots+change style+filter list
   *
   */
  function afterSupportScatter() {
    // hide previous
    // hide captions
    g.selectAll(".scatterCaption")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // hide next
    g.selectAll(".safeBalls.captions")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".unsafeBall")
      .transition()
      .duration(fadeOutDuration)
      .attr("r", 0);
    g.selectAll(".safeBall")
      .transition()
      .duration(fadeOutDuration)
      .attr("r", 0);
    // redraw some parts that may be erased out
    showAxis(xAxisScatter, "bottomAxis", yAxisScatter, "leftAxis");
    g.selectAll("#xyauxiliary")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0.8);
    g.selectAll(".shapeLegendScatter")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);
    g.selectAll(".scatterAxisLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);

    // show new
    g.selectAll(".originalDot")
      .transition()
      .duration(fadeOutDuration)
      .attr("transform", function (d) {
        return `translate(${xScatterScale(
          d.basic_expenses
        )},${yScatterScale(d.basic_income)})`;
      })
      .style("stroke", function (d) {
        return scatterColors(d.financial_status);
      })
      .style("fill", "none")
      .attr("opacity", scatterOpacity);

    g.selectAll(".connectLine")
      .transition()
      .delay(200)
      .duration(fadeOutDuration)
      .attr("opacity", scatterOpacity)
      .attr("y1", function (d) {
        return yScatterScale(d.supported_income);
      });

    g.selectAll(".afterDot")
      .transition()
      .delay(200 + 200)
      .duration(fadeOutDuration)
      .attr("transform", function (d) {
        return `translate(${xScatterScale(
          d.basic_expenses
        )},${yScatterScale(d.supported_income)})`;
      })
      .attr("opacity", scatterOpacity);

    g.selectAll(".colorLegend")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);

    // to-do: add a filter and change the content
    d3.select("#scatterSelectButton")
      .transition()
      .duration(fadeOutDuration)
      .attr("hidden", null);

    d3.selectAll(".scatterOptions").attr("selected", function (d) {
      if (d === "All") {
        return true;
      } else {
        return false;
      }
    });
    d3.select(".scatter-final-content").html(originalTextConent);

    // When the button is changed, run the updateChart function
    d3.select("#scatterSelectButton").on("change", function (d) {
      // recover the option that has been chosen
      var selectedOption = d3.select(this).property("value");
      // run the updateChart function with this selected option
      updateScatterByChoice(selectedOption);
    });

    // updateScatterByChoice("All");
  }

  function updateScatterByChoice(selectedGroup) {
    // if chosen all, return all
    console.log(selectedGroup);
    if (selectedGroup === "All") {
      d3.selectAll(".PhD-Track, .MSc, .PhD")
        .transition()
        .duration(fadeOutDuration)
        .attr("opacity", scatterOpacity);
      d3.select(".scatter-final-content").html(originalTextConent);
    } else {
      // show the selected group and hide others
      d3.selectAll(`.PhD, .PhD-Track, .MSc`)
        .transition()
        .duration(fadeOutDuration)
        .attr("opacity", 0);
      d3.selectAll(`.${selectedGroup}`)
        .transition()
        .duration(fadeOutDuration)
        .attr("opacity", scatterOpacity);

      switch (selectedGroup) {
        case "PhD": {
          d3.select(".scatter-final-content").html(
            "<p>Here we see the income vs. expenses for only computer science Ph.D. students. Unfilled shapes represent just the basic income (RA-ship + TA-ship) vs. basic expenses. Filled in shapes represent supported income (RA-ship + TA-ship + other awards or internships) for that student. Shapes that are connected by a dotted line represent 1 student.</p>"
          ); //cannot have transition (not in svg)
          break;
        }
        case "MSc": {
          d3.select(".scatter-final-content").html(
            "<p>Here we see the income vs. expenses for only computer science M.Sc. students. Unfilled shapes represent just the basic income (RA-ship + TA-ship) vs. basic expenses. Filled in shapes represent supported income (RA-ship + TA-ship + other awards or internships) for that student. Shapes that are connected by a dotted line represent 1 student. </p>"
          );
          break;
        }
        case "PhD-Track": {
          d3.select(".scatter-final-content").html(
            "<p>Here we see the income vs. expenses for only computer science Ph.D.-track students. Unfilled shapes represent just the basic income (RA-ship + TA-ship) vs. basic expenses. Filled in shapes represent supported income (RA-ship + TA-ship + other awards or internships) for that student. Shapes that are connected by a dotted line represent 1 student.</p>"
          );
          break;
        }
        default: {
          d3.selectAll(".PhD-Track, .MSc, .PhD")
            .transition()
            .duration(fadeOutDuration)
            .attr("opacity", scatterOpacity);
          d3.select(".scatter-final-content").html(originalTextConent);
          break;
        }
      }
    }
  }

  /**
   * showSafeBalls - safeBall
   *
   * hides previous: scatterplot
   * hides next: lollipop
   * shows now: safeBall
   *
   */
  function showSafeBalls() {
    // will moveto setup later

    // hide previous
    d3.select(".scatter-final-content").html(originalTextConent);

    d3.select("#scatterSelectButton")
      .transition()
      .duration(fadeOutDuration)
      .attr("hidden", "hidden");
    hideAxis("bottomAxis", "leftAxis");
    g.selectAll(".connectLine")
      .transition()
      .duration(100)
      .attr("y1", function (d) {
        return yScatterScale(d.basic_income);
      });
    g.selectAll(".afterDot")
      .transition()
      .duration(fadeOutDuration)
      .attr("transform", function (d, i) {
        return `translate(${safeBallPos.unsafecx},${safeBallPos.unsafecy})`;
      })
      .transition()
      .duration(0)
      .attr("opacity", 0);
    g.selectAll(".originalDot")
      .transition()
      .duration(fadeOutDuration)
      .attr("transform", function (d, i) {
        return `translate(${safeBallPos.safecx},${safeBallPos.safecy})`;
      })
      .transition()
      .duration(0)
      .attr("opacity", 0);
    g.selectAll("#xyauxiliary").transition().duration(100).attr("opacity", 0);
    g.selectAll(".shapeLegendScatter")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".colorLegend")
      .transition("hideColorLegend")
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".scatterAxisLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // hide next
    // todo: hide lollipop
    d3.select("#observable-embed-lollipop")
      .transition()
      .duration(fadeOutDuration)
      .style("opacity", 0)
      .transition()
      .duration(0)
      .style("display", "none");

    // show new: reserve for progress function
    // g.selectAll(".unsafeBall")
    //   .transition()
    //   .delay(200)
    //   .duration(fadeOutDuration)
    //   .attr("r", unsafeNum + adjustR);
    // g.selectAll(".safeBall")
    //   .transition()
    //   .delay(200)
    //   .duration(fadeOutDuration)
    //   .attr("r", safeNum + adjustR);
    // g.selectAll(".safeBalls.captions")
    //   .transition()
    //   .duration(fadeOutDuration)
    //   .attr("opacity", 1);
  }

  /**
   * showLollipop - Lollipop
   *
   * hides previous: safeBall
   * hides next: barchart
   * shows now: lollipop
   *
   */
  function showLollipop() {
    // hide previous
    g.selectAll(".safeBalls.captions")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".unsafeBall")
      .transition()
      .duration(fadeOutDuration)
      .attr("r", 0);
    g.selectAll(".safeBall")
      .transition()
      .duration(fadeOutDuration)
      .attr("r", 0);
    // g.selectAll(".square").transition().duration(800).attr("opacity", 0);

    // hide next: barchart
    hideAxis("topAxis", null);
    g.selectAll(".fundingBar")
      .transition()
      .duration(fadeOutDuration)
      .attr("width", 0);
    g.selectAll(".colBar")
      .transition()
      .duration(fadeOutDuration)
      .attr("width", 0);
    g.selectAll(".barText")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".yBarLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.select(".colAndFundingLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // show now
    // todo: show lollipop
    d3.select("#observable-embed-lollipop")
      .transition()
      .duration(fadeOutDuration)
      .style("opacity", 1);

    d3.select("#observable-embed-lollipop")
      .transition()
      .duration(0)
      .style("display", "initial")
      .transition()
      .duration(fadeOutDuration)
      .style("opacity", 1);
    // .style("display", "block");
  }

  /**
   * showDivergingBar - barchart
   *
   * hides previous: lollipop
   * hides next: reverse bar
   * shows now: overlappingBarchart
   *
   */
  function showDivergingBar() {
    // hides previous: hide lollipop
    d3.select("#observable-embed-lollipop")
      .transition()
      .duration(fadeOutDuration)
      .style("opacity", 0)
      .transition()
      .duration(0)
      .style("display", "none");
    // .style("display", "none");

    // hides next:
    // g.selectAll(".colBar")
    //   .transition()
    //   .duration(fadeOutDuration)
    //   .attr("x", function (d) {
    //     return xBarScale(d.Yearly_funding_kCAD);
    //   })
    //   .attr("width", 0);

    // shows now
    var maxFigure = Math.max(
      -d3.min(dataDict["phdFunding"], function (d) {
        return d.Yearly_col_kCAD_neg;
      }),
      d3.max(dataDict["phdFunding"], function (d) {
        return d.Yearly_funding_kCAD;
      })
    );
    // set the bar scale's domain
    xBarScale.domain([-maxFigure, maxFigure]);

    showAxis(xAxisBar, "topAxis", null, null);
    g.select(".colAndFundingLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);

    g.selectAll(".yBarLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);
    g.selectAll(".fundingBar")
      .transition("showBar")
      .duration(fadeOutDuration)
      .attr("x", function (d) {
        return xBarScale(0);
      })
      .attr("width", function (d) {
        return xBarScale(d.Yearly_funding_kCAD) - xBarScale(0);
      });

    g.selectAll(".colBar")
      .transition("showBar")
      .duration(fadeOutDuration)
      .attr("x", function (d) {
        return xBarScale(d.Yearly_col_kCAD_neg);
      })
      .attr("width", function (d) {
        // console.log(d.University + `:${d.Yearly_col_kCAD_neg}`);
        return xBarScale(0) - xBarScale(d.Yearly_col_kCAD_neg);
      });

    g.selectAll(".barText")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);

    // highlight UBC
    flashHighlightBar();
  }

  /**
   * showOverlappingBar - barchart
   *
   * hides previous: diverging barchart
   * hides next: reordered barchart
   * shows now: barchart
   *
   */
  function showOverlappingBar() {
    // hide previous
    g.select(".colAndFundingLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    // hide next: revert ordering
    yBarScale.domain(
      dataDict["phdFunding"].map(function (d) {
        return d.University;
      })
    );
    // showAxis(null, null, yAxisBar, "leftAxis");

    // hide previous + shows now
    xBarScale.domain([
      0,
      d3.max(dataDict["phdFunding"], function (d) {
        return d.Yearly_funding_kCAD;
      })
    ]);
    showAxis(xAxisBar, "topAxis", null, null); // need to redraw because it may come back from following sections

    // after reseting x and y scales
    g.selectAll(".fundingBar")
      .transition("revertOrder")
      .duration(fadeOutDuration)
      .attr("width", function (d) {
        return xBarScale(d.Yearly_funding_kCAD);
      })
      .attr("x", function (d) {
        return xBarScale(0);
      })
      .attr("y", function (d) {
        return yBarScale(d.University);
      });
    g.selectAll(".barText")
      .transition("revertOrder")
      .duration(fadeOutDuration)
      .attr("y", function (d) {
        return yBarScale(d.University);
      });
    g.selectAll(".colBar")
      .transition("showBar")
      .duration(fadeOutDuration)
      .attr("x", function (d) {
        return xBarScale(d.Yearly_funding_kCAD - d.Yearly_col_kCAD);
      })
      .attr("y", function (d) {
        return yBarScale(d.University);
      })
      .attr("width", function (d) {
        return xBarScale(d.Yearly_col_kCAD);
      });

    // g.selectAll(".colBar")
    //   .transition()
    //   .duration(fadeOutDuration)
    //   .attr("width", function (d) {
    //     return xBarScale(d.Yearly_col_kCAD);
    //   })
    //   .attr("x", function (d) {
    //     return xBarScale(d.Yearly_funding_kCAD - d.Yearly_col_kCAD);
    //   });
  }

  /**
   * reOrderBar - barchart
   *
   * hides previous: overlaping barchart (original order)
   * hides next:
   * shows now: barchart
   *
   */
  function reOrderBar() {
    // hide next -- redraw
    d3.select("#vis")
      .transition()
      .duration(0)
      .style("display", "initial")
      .transition()
      .duration(fadeOutDuration)
      .style("opacity", 1);

    // d3.select("#unionLogo svg image")
    //   .transition()
    //   .duration(fadeOutDuration)
    //   .attr("opacity", 0);
    // d3.select("#unionLogo").style("display", "none");

    g.selectAll(".yBarLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 1);

    // draw new
    dataDict["phdFundingSorted"] = dataDict["phdFunding"]
      .concat()
      .sort(function (a, b) {
        return d3.ascending(
          Number(a["Yearly_left_kCAD"]),
          Number(b["Yearly_left_kCAD"])
        );
      });

    // update
    yBarScale.domain(
      dataDict["phdFundingSorted"].map(function (d) {
        return d.University;
      })
    );
    showAxis(xAxisBar, "topAxis", null, null); // need to redraw because it may come back from following sections

    // showAxis(null, null, yAxisBar, "leftAxis");
    g.selectAll(".fundingBar")
      .transition("reorder")
      .duration(fadeOutDuration)
      .attr("width", function (d) {
        return xBarScale(d.Yearly_funding_kCAD);
      })
      .attr("y", function (d) {
        return yBarScale(d.University);
      });
    g.selectAll(".colBar")
      .transition("reorder")
      .duration(fadeOutDuration)
      .attr("width", function (d) {
        return xBarScale(d.Yearly_col_kCAD);
      })
      .attr("y", function (d) {
        return yBarScale(d.University);
      });
    g.selectAll(".barText")
      .transition("show")
      .duration(0)
      .attr("opacity", 1)
      .transition("reorder")
      .duration(fadeOutDuration)
      .attr("y", function (d) {
        return yBarScale(d.University);
      });

    flashHighlightBar();
  }
  /**
   * closingTitle
   *
   * hides previous: barchart
   * hides next:
   * shows now:
   *
   */
  function closingTitle() {
    // hide previous
    hideAxis("topAxis");
    g.selectAll(".yBarLabel")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
    g.selectAll(".fundingBar")
      .transition()
      .duration(fadeOutDuration)
      .attr("width", 0);
    g.selectAll(".colBar")
      .transition()
      .duration(fadeOutDuration)
      .attr("width", 0);
    g.selectAll(".barText")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);

    d3.select("#vis")
      .transition()
      .duration(fadeOutDuration)
      .style("opacity", 0)
      .transition()
      .duration(0)
      .style("display", "none");

    // // show now
    // d3.select("#unionLogo").style("display", "initial");
    // d3.select("#unionLogo svg image")
    //   .transition()
    //   .duration(fadeOutDuration)
    //   .attr("opacity", 1);
  }

  /**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param axis - the axis to show
   *  (xAxisHist or xAxisBar)
   */
  function showAxis(
    xAxis = null,
    xAxisPos = null,
    yAxis = null,
    yAxisPos = null
  ) {
    if (xAxis != null) {
      g.select(`.x.${xAxisPos}`)
        .transition()
        .duration(500)
        .call(xAxis)
        .style("opacity", 1);
    }
    if (yAxis != null) {
      g.select(`.y.${yAxisPos}`)
        .transition()
        .duration(500)
        .call(yAxis)
        .style("opacity", 1);
    }
  }

  /**
   * hideAxis - helper function
   * to hide the axis
   *
   */
  function hideAxis(xAxisPos = null, yAxisPos = null) {
    if (xAxisPos != null) {
      g.select(`.x.${xAxisPos}`).transition().duration(500).style("opacity", 0);
    }
    if (yAxisPos != null) {
      g.select(`.y.${yAxisPos}`).transition().duration(500).style("opacity", 0);
    }
  }

  /**
   * subCPIHighlightHide - linechart
   *
   * helper function.
   */
  function subCPIHighlightHide(subCPI, subName) {
    g.selectAll(`.multiCPILine.${subCPI}`)
      .transition()
      .duration(fadeOutDuration - 100)
      .attr("opacity", 0.2);
    g.selectAll(`.multiCPILineLabels.${subCPI}`)
      .transition()
      .duration(fadeOutDuration - 100)
      .attr("opacity", 0.2);
    g.selectAll(`.HLine.${subName}`)
      .transition()
      .duration(fadeOutDuration)
      .attr("x2", width);
    g.selectAll(`.HLineLabel.${subName}`)
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", 0);
  }

  /**
   * subCPIHighlight - linechart
   *
   * helper function.
   */
  function subCPIHighlight(subCPI, subName, lastCPI) {
    g.selectAll(`.multiCPILine.${subCPI}`)
      .transition()
      .duration(fadeOutDuration - 100)
      // .style("stroke-width", 2 + 10)
      .attr("opacity", lineOpacity);
    g.selectAll(`.multiCPILineLabels.${subCPI}`)
      .transition()
      .duration(0)
      // .style("font-size", fontSize + 20)
      .attr("opacity", 1);

    // auxiliary line for highlighter
    g.append("g")
      .attr("class", `${subName} LineAuxi`)
      .append("line")
      .attr("class", `${subName} HLine`)
      .attr("x1", width)
      .attr("x2", width)
      .attr("y1", yLineCPIScale(lastCPI))
      .attr("y2", yLineCPIScale(lastCPI))
      .attr("stroke", "grey")
      .attr("opacity", 0.8)
      .attr("stroke-dasharray", "3,2")
      .transition()
      .duration(fadeOutDuration)
      .attr("x2", 0);

    g.select(`.${subName}.LineAuxi`)
      .append("text")
      .attr("class", `${subName} HLineLabel`)
      .attr("x", 10)
      .attr("y", yLineCPIScale(lastCPI) - 5)
      .transition()
      .duration(fadeOutDuration)
      .text(`${subName}: ${(lastCPI * 100).toFixed(2)}%`)
      .style("font-size", fontSize);
  }

  /**
   * flashHighlightBar - barChart
   *
   * helper function to hightlight UBC.
   */
  function flashHighlightBar(
    delay = 600,
    duration = fadeOutDuration,
    repeat = 2
  ) {
    for (var i = 0; i < repeat; i++) {
      g.selectAll(".highlightBar")
        .transition()
        .delay(delay + duration * 2 * i)
        .duration(duration)
        .attr("fill", "gold");
      g.select(".highlightBar.colBar")
        .transition()
        .delay(delay + duration + duration * 2 * i)
        .duration(duration)
        .attr("fill", barColors("col"));
      g.select(".highlightBar.fundingBar")
        .transition()
        .delay(delay + duration + duration * 2 * i)
        .duration(duration)
        .attr("fill", barColors("Funding"));
    }
  }

  /**
   * UPDATE FUNCTIONS
   *
   * These will be called within a section
   * as the user scrolls through it.
   *
   * We use an immediate transition to
   * update visual elements based on
   * how far the user has scrolled
   *
   */

  /**
   * updateSafeBalls - safeBall
   *
   * update size of ball based on how much has been scrolled.
   *
   */
  function updateSafeBalls(progress) {
    g.selectAll(".unsafeBall")
      .transition()
      // .delay(200)
      .duration(fadeOutDuration)
      .attr("r", (unsafeNum + adjustR) * Math.min(1, 2 * progress));
    g.selectAll(".safeBall")
      .transition()
      // .delay(200)
      .duration(fadeOutDuration)
      .attr("r", (safeNum + adjustR) * Math.min(1, 2 * progress));
    g.selectAll(".safeBalls.captions")
      .transition()
      .duration(fadeOutDuration)
      .attr("opacity", Math.min(1, 2 * progress));
  }

  /**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */

  /**
   * fundingDataPreprocessor
   *
   * Currently it does nothing.
   * @param rawData - data read in from file
   */
  function fundingDataPreprocessor(rawData) {
    return rawData.map((d) => ({
      University: d["University"],
      Yearly_funding_kCAD: +d.Yearly_funding_kCAD,
      Yearly_col_kCAD: +d.Yearly_col_kCAD,
      Yearly_col_kCAD_neg: -d.Yearly_col_kCAD,
      Funding_col_ratio: +d.Funding_col_ratio,
      Yearly_left_kCAD: +d.Yearly_left_kCAD
    }));
  }

  function colDataPreprocessor(rawData) {
    var temp = rawData.map((d) => ({
      program: d["Program"],
      basic_expenses: +d["Basic_Expenses"],
      basic_income: +d["Basic_Income"],
      supported_income: +d["Supported_Income"]
      // financial_status:
      //   d.basic_income > d.basic_expenses
      //     ? "always_enough"
      //     : d.supported_income > d.basic_expenses
      //     ? "enough_after_support"
      //     : "still_not_enough"
    }));

    temp.forEach(function (d) {
      if (d.basic_income > d.basic_expenses) {
        d.financial_status = "always_enough";
      } else if (d.supported_income > d.basic_expenses) {
        d.financial_status = "enough_after_support";
      } else {
        d.financial_status = "still_not_enough";
      }
    });

    return temp;
  }

  function cpi22DataPreprocessor(rawData) {
    return rawData.map((d) => ({
      Time: d3.timeParse("%y-%b")(d.Time),
      allItems: +d.allItems,
      MonthCPI: +d.MonthCPI,
      FoodMonthCPI: +d.FoodMonthCPI,
      ShelterMonthCPI: +d.ShelterMonthCPI,
      HouseholdMonthCPI: +d.HouseholdMonthCPI,
      ClothingMonthCPI: +d.ClothingMonthCPI,
      TransportationMonthCPI: +d.TransportationMonthCPI,
      HealthMonthCPI: +d.HealthMonthCPI,
      RecreationMonthCPI: +d.RecreationMonthCPI
      // AlcoholicMonthCPI: +d.AlcoholicMonthCPI
    }));
  }

  function cpiDataPreprocessor(rawData) {
    return rawData.map((d) => ({
      Time: d3.timeParse("%y-%b")(d.Time),
      allItems: +d.allItems,
      YearGroup: +d.YearGroup,
      MonthCPI: +d.MonthCPI
    }));
  }

  // credit: https://observablehq.com/@nikomccarty/connected-scatterplot-animation-d3#length
  function length(path) {
    return d3
      .select(".forTest")
      .attr("fill", "none")
      .attr("d", path)
      .node()
      .getTotalLength();
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function (index) {
    activeIndex = index;
    var sign = activeIndex - lastIndex < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function (i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  chart.update = function (index, progress) {
    updateFunctions[index](progress);
  };

  chart.appendNewData = function (newData, key) {
    // dataList.push(newData);
    dataDict[key] = newData;
  };

  // return chart function
  return chart;
};

/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(
  error,
  bcCPIRawdata,
  year22CPI,
  phdFundingRawdata,
  colProgramsRawData
) {
  // create a new plot and
  // display it

  var plot = scrollVis();
  plot.appendNewData(bcCPIRawdata, "bcPCI");
  plot.appendNewData(year22CPI, "PCI22");
  plot.appendNewData(phdFundingRawdata, "phdFunding");
  plot.appendNewData(colProgramsRawData, "colPrograms");
  d3.select("#vis").call(plot); // `plot` function accept one parameter: selection

  // setup scroll functionality
  var scroll = scroller().container(d3.select("#graphic"));

  // pass in .step selection as the steps
  scroll(d3.selectAll(".step"));

  // setup event handling
  scroll.on("active", function (index) {
    // highlight current step text
    d3.selectAll(".step").style("opacity", function (d, i) {
      return i === index ? 1 : 0.1;
    });

    // activate current section
    plot.activate(index);
  });

  scroll.on("progress", function (index, progress) {
    plot.update(index, progress);
  });
}

// load data and display
// d3.csv("data/phdFunding.csv", display);

// note that the order of reading will determine
// the order of parameters of `display`
d3.queue()
  .defer(d3.csv, "/data/bcCPI.csv")
  .defer(d3.csv, "/data/year22.csv")
  .defer(d3.csv, "/data/phdFunding.csv")
  .defer(d3.csv, "/data/CoL_programs.csv")
  .await(display);
