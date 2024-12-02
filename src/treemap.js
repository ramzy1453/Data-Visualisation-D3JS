import * as d3 from "d3";
import { coffee } from "./data";

const data = {
  name: "root",
  children: Array.from(d3.group(coffee, (d) => d.roast)).map(
    ([key, value], label) => ({
      name: key === "" ? "Unknown" : key,
      children: Array.from(d3.group(value, (d) => d.loc_country)).map(
        ([key, value]) => ({
          name: key,
          count: value.length,
        })
      ),
    })
  ),
};
function initDescendences(data) {
  const descendences = [];
  function transverseRoot(data) {
    if (!data) return;
    descendences.push(data);

    if (typeof data === "object" && !Array.isArray(data) && data !== null) {
      return transverseRoot(data.children);
    }

    if (Array.isArray(data)) {
      return data.map(transverseRoot);
    }
  }
  transverseRoot(data);
  return descendences;
}

const descendences = initDescendences(data);

const totalCount = data.children.reduce(
  (acc, curr) => acc + curr.children.reduce((acc, curr) => acc + curr.count, 0),
  0
);

let counter = 0;

function generateUid(prefix = "id") {
  counter += 1;
  return `${prefix}-${counter}`;
}

// Specify the chart’s dimensions.
const width = 1200;
const height = 800;

// Specify the color scale.
const color = d3.scaleOrdinal(
  data.children.map((d) => d.name),
  d3.schemeCategory10
);

// Compute the layout.
const root = d3
  .treemap()
  .tile(d3.treemapSquarify) // e.g., d3.treemapSquarify
  .size([width, height])
  .padding(1)
  .round(true)(
  d3
    .hierarchy(data)
    .sum((d) => d.count)
    .sort((a, b) => b.count - a.count)
);

console.log(root.descendants());
// Create the SVG container.
const svg = d3.select("svg");

// Add a cell for each leaf of the hierarchy.

const leaf = svg
  .selectAll("g")
  .data(root.descendants())
  .join("g")
  .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

// Append a tooltip.
const format = d3.format(",d");
leaf.append("title").text(
  (d) =>
    `${d
      .ancestors()
      .reverse()
      .map((d) => d.data.name)
      .join(".")}\n${format(d.value)}`
);

// Append a color rectangle.
leaf
  .append("rect")
  .attr("id", (d) => (d.leafUid = generateUid("leaf")))
  .attr("fill", (d) => {
    if (d.depth === 2) {
      return color(d.data.name);
    }
  })
  .attr("fill-opacity", 0.6)
  .attr("width", (d) => d.x1 - d.x0)
  .attr("height", (d) => d.y1 - d.y0);

leaf
  .on("mouseover", function (event, d) {
    const tooltip = d3.select("#tooltip");

    tooltip
      .style("opacity", 1)
      .style("left", `${event.pageX}px`)
      .style("top", `${event.pageY}px`)
      .style("position", "absolute")
      .style("background-color", "black")
      .style("border", "1px solid white")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("color", "white").html(`
      <div>
          <h3>${d.data.name}</h3>
          <p>${getPourcentage(d)}%</p>
        </div>
        `);

    // apply border to this
    if (d.depth < 2) {
      d3.select(this)
        .select("rect")
        .style("stroke", "black")
        .style("stroke-width", 8);
    }

    // apply border to parent
  })
  .on("mouseout", function (event, d) {
    // remove tooltip
    const tooltip = d3.select("#tooltip");
    tooltip.style("opacity", 0);

    // remove border
    d3.select(this).select("rect").style("stroke", null);
  });

function getPourcentage(d) {
  switch (d.depth) {
    case 0:
      return 100;
    case 1:
      return ((100 * d.value) / totalCount).toFixed(2);
    case 2:
      return (
        (100 * d.data.count) /
        d.parent.data.children.reduce((acc, curr) => acc + curr.count, 0)
      ).toFixed(2);
    default:
      break;
  }
}
