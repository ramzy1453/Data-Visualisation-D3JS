import * as d3 from "d3";
import { abalone } from "./data";

console.log({ abalone });

const svg = d3.select("svg").attr("width", 960).attr("height", 500);

// Configuration
const width = 500;
const height = 400;
const margin = { top: 20, right: 30, bottom: 50, left: 50 };

const color = d3.scaleOrdinal(d3.schemeCategory10);
// Création de l'échelle

const heights = abalone.map(({ height }) => height);
const widths = abalone.map((d) => d.width);
const xScale = d3
  .scaleLinear()
  .domain([d3.min(widths), d3.max(widths)]) // Domain basé sur X
  .range([margin.left, width - margin.right]);

const yScale = d3
  .scaleLinear()
  .domain([d3.min(heights), d3.max(heights)]) // Domain basé sur Y
  .range([height - margin.bottom, margin.top]);

// Ajout des axes
svg
  .append("g")
  .attr("transform", `translate(0, ${height - margin.bottom})`)
  .call(d3.axisBottom(xScale))
  .append("text")
  .attr("class", "axis-label")
  .attr("x", width / 2)
  .attr("y", 35)
  .attr("fill", "black")
  .text("X Axis");

svg
  .append("g")
  .attr("transform", `translate(${margin.left}, 0)`)
  .call(d3.axisLeft(yScale))
  .append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -35)
  .attr("fill", "black")
  .text("Y Axis");

svg
  .selectAll(".dot")
  .data(abalone)
  .enter()
  .append("circle")
  .attr("class", "dot")
  .attr("cx", (d) => xScale(d.width))
  .attr("cy", (d) => yScale(d.height))
  .attr("r", (d) => d.rings)
  .attr("opacity", 0.5)
  .attr("fill", (d) => color(d.genre));

const legend = svg
  .append("g")
  .attr("transform", `translate(${width - margin.right + 100}, ${margin.top})`); // Position de la légende

legend
  .selectAll(".legend-item")
  .data(["M", "F", "I"])
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .attr("transform", (d, i) => `translate(0, ${i * 20})`) // Espacement entre les   items
  .each(function (d) {
    // Dessine le carré de couleur
    d3.select(this)
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(d));

    d3.select(this)
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(d)
      .attr("font-size", "12px")
      .attr("fill", "black");
  });

legend
  .selectAll(".legend-item")
  .data([4, 8, 12])
  .append("circle")
  .attr("class", "dot")
  .attr("cx", 15)
  .attr("cy", 80)
  .attr("r", (d) => d)
  .attr("fill", "none")
  .attr("transform", (d, i) => `translate(0, ${i * 20})`)
  .attr("stroke", "black");

legend
  .selectAll(".legend-item")
  .data([4, 8, 12])
  .append("text")
  .attr("x", 35)
  .attr("y", 85)
  .text((d) => d)
  .attr("font-size", "12px")
  .attr("transform", (d, i) => `translate(0, ${i * 20})`)
  .attr("fill", "black");
