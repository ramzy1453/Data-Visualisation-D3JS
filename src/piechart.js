import * as d3 from "d3";
import { coffee } from "./data";

const roasts = d3.group(coffee, (d) => d.roast).entries();
const data = [];
const labels = [];
for (const [key, value] of roasts) {
  data.push(value.length);
  if (key === "") {
    labels.push("Unknown");
  } else {
    labels.push(key);
  }
}

const roastSum = data.reduce((acc, curr) => acc + curr, 0);
const colors = d3.schemeAccent;

const svg = d3.select("svg");

const pie = d3.pie();
const arcs = pie(data);

const width = 960;
const height = 500;

const g = svg
  .append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

const arc = d3.arc().innerRadius(0).outerRadius(200);

g.selectAll("path")
  .data(arcs)
  .enter()
  .append("path")
  .attr("fill", (d) => colors[d.index])
  .attr("d", arc)
  .on("mouseover", function (event, d) {
    // tooltip
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
      .style("color", "white")
      .html(
        `<p>${labels[d.index]}: ${((100 * data[d.index]) / roastSum).toFixed(
          2
        )}%</p>`
      );
  })
  .on("mouseout", function (event, d) {
    // remove tooltip
    const tooltip = d3.select("#tooltip");
    tooltip.style("opacity", 0);

    d3.select(this).attr("fill", colors[d.index]);
  });

// Legends
const legend = svg
  .append("g")
  .attr("transform", `translate(${width - 200}, 20)`)
  .selectAll("g")
  .data(labels)
  .enter()
  .append("g")
  .attr("transform", (d, i) => `translate(0, ${i * 20})`);

legend
  .append("rect")
  .attr("width", 10)
  .attr("height", 10)
  .attr("fill", (d, i) => colors[i]);

legend
  .append("text")
  .text((d) => d)
  .attr("fill", "black")
  .attr("x", 15)
  .attr("y", 10);
