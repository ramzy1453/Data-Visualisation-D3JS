import * as d3 from "d3";
import { chimie, correlations, lines, rows } from "./data_chimie";

const svg = d3.select("svg").attr("width", 800).attr("height", 800);

// Configuration
const width = +svg.attr("width");
const height = +svg.attr("height");

const color = d3
  .scaleLinear()
  .domain([-1, 0, 1])
  .range(["blue", "white", "red"]);
for (let i = 0; i < correlations.length; i++) {
  const corr = correlations[i];
  for (let j = 0; j < corr.length; j++) {
    const c = corr[j];
    console.log(c.value);
    // draw circles
    svg
      .append("circle")
      .attr("cx", 100 + i * 50)
      .attr("cy", 100 + j * 50)
      .attr("r", 10)
      .attr("fill", color(c.value))
      .attr("stroke", "black")
      .attr("stroke-width", 0.4);
    // draw text
    svg
      .append("text")
      .attr("x", 100 + i * 50)
      .attr("y", 100 + j * 50)
      .attr("dy", ".35em")
      .text(c.value.toFixed(1))
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", "10px")
      .attr("fill", "black");
  }
}

// draw texts
for (let i = 0; i < rows.length; i++) {
  svg
    .append("text")
    .attr("x", 35)
    .attr("y", 100 + i * 51)
    .text(rows[i]);
}

for (let i = 0; i < lines.length; i++) {
  svg
    .append("text")
    .attr("x", 100 + i * 49)
    .attr("y", 50)
    .text(lines[i]);
}

// Définir le dégradé SVG
const defs = svg.append("defs");

const gradient = defs
  .append("linearGradient")
  .attr("id", "color-gradient")
  .attr("x1", "0%") // Début du dégradé (gauche)
  .attr("x2", "100%") // Fin du dégradé (droite)
  .attr("y1", "0%")
  .attr("y2", "0%");

// Ajouter les stops au dégradé
gradient.append("stop").attr("offset", "0%").attr("stop-color", "blue"); // Correspond à -1

gradient.append("stop").attr("offset", "50%").attr("stop-color", "white"); // Correspond à 0

gradient.append("stop").attr("offset", "100%").attr("stop-color", "red"); // Correspond à 1

// Dessiner le rectangle avec le dégradé
svg
  .append("rect")
  .attr("x", 25)
  .attr("y", height * 0.7)
  .attr("width", width / 3)
  .attr("height", 36)
  .style("fill", "url(#color-gradient)"); // Utiliser le dégradé comme couleur

// Ajouter un axe pour représenter la plage de valeurs
const scale = d3
  .scaleLinear()
  .domain([-1, 1]) // Plage de données
  .range([25, width / 3 + 25]); // Plage de pixels (position sur l'axe)

const axis = d3.axisBottom(scale).ticks(5); // Nombre de graduations

svg
  .append("g")
  .attr("transform", `translate(0, ${height * 0.7 + 40})`) // Position de l'axe
  .call(axis);