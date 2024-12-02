import * as d3 from "d3";
import { extractColumns, getIndex, getType, glass } from "./data";

const columns = extractColumns(glass);

const standarizedColumns = columns.map((column) => {
  const mean = column.reduce((acc, curr) => acc + curr, 0) / column.length;
  const std = Math.sqrt(
    column.reduce((acc, curr) => acc + (curr - mean) ** 2, 0) / column.length
  );

  return column.map((value) => (value - mean) / std);
});

function covariance(data, colX, colY) {
  const meanX =
    data[colX].reduce((acc, curr) => acc + curr, 0) / data[colX].length;
  const meanY =
    data[colY].reduce((acc, curr) => acc + curr, 0) / data[colY].length;

  return (
    data[colX].reduce(
      (acc, curr, i) => acc + (curr - meanX) * (data[colY][i] - meanY),
      0
    ) / data[colX].length
  );
}

function covarianceMatrix(data) {
  const matrix = [];

  for (let i = 0; i < data.length; i++) {
    matrix.push([]);
    for (let j = 0; j < data.length; j++) {
      matrix[i].push(covariance(data, i, j));
    }
  }

  return matrix;
}

const covMat = covarianceMatrix(standarizedColumns);

const {
  E: { x: eigenvectors },
  lambda: { x: eigenvalues },
} = numeric.eig(covMat);

function sortEigenvalues(eigenvalues, eigenvectors) {
  const eigenPairs = eigenvalues.map((value, index) => ({
    value,
    vector: eigenvectors[index],
  }));

  return eigenPairs.sort((a, b) => b.value - a.value);
}

const eigens = sortEigenvalues(eigenvalues, eigenvectors);

const data = eigens
  .slice(0, 2)
  .map((eig) => numeric.dot(eig.vector, standarizedColumns));

// Configuration
const width = 500;
const height = 400;
const margin = { top: 20, right: 30, bottom: 50, left: 50 };

const color = d3.scaleOrdinal(d3.schemeCategory10);

// Création de l'échelle
const xScale = d3
  .scaleLinear()
  .domain([d3.min(data[0]), d3.max(data[0])]) // Domain basé sur X
  .range([margin.left, width - margin.right]);

const yScale = d3
  .scaleLinear()
  .domain([d3.min(data[1]), d3.max(data[1])]) // Domain basé sur Y
  .range([height - margin.bottom, margin.top]);

// Création du canevas SVG
const svg = d3.select("svg");

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

// Transformation des données
const points = data[0].map((x, i) => ({ x, y: data[1][i] }));

// Ajout des points
svg
  .selectAll(".dot")
  .data(points)
  .enter()
  .append("circle")
  .attr("class", "dot")
  .attr("cx", (d) => xScale(d.x))
  .attr("cy", (d) => yScale(d.y))
  .attr("r", 5)
  .attr("fill", (d, i) => {
    const type = getType(glass[i].at(-1));
    return color(type);
  });

// Legend

const legend = svg
  .append("g")
  .attr("transform", `translate(${width - margin.right + 100}, ${margin.top})`); // Position de la légende

legend
  .selectAll(".legend-item")
  .data(["RI", "Na", "Mg", "Al", "Si", "K", "Ca", "Ba", "Fe"])
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .attr("transform", (d, i) => `translate(0, ${i * 20})`) // Espacement entre les items
  .each(function (d, i) {
    // Dessine le carré de couleur
    d3.select(this)
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(i));

    // Ajoute le texte
    d3.select(this)
      .append("text")
      .attr("x", 20)
      .attr("y", 12) // Position ajustée pour aligner avec le carré
      .text(d)
      .attr("font-size", "12px")
      .attr("fill", "black");
  });

function calculateContributions(eigenvectors, eigenvalues) {
  return eigenvectors.map((vector, componentIndex) =>
    vector.map(
      (coordinate) => Math.abs(coordinate) ** 2 * eigenvalues[componentIndex]
    )
  );
}

const contributions = calculateContributions(eigenvectors, eigenvalues);

// Données pour les graphiques
const variableLabels = ["RI", "Na", "Mg", "Al", "Si", "K", "Ca", "Ba", "Fe"];
const cp1Contributions = contributions[0];
const cp2Contributions = contributions[1];

// Étape 2 : Dimensions des graphiques
const barWidth = 400;
const barHeight = 200;
const barMargin = { top: 20, right: 30, bottom: 50, left: 50 };

// Scales
const xScaleBar = d3
  .scaleBand()
  .domain(variableLabels)
  .range([barMargin.left, barWidth - barMargin.right])
  .padding(0.1);

const yScaleBarCP1 = d3
  .scaleLinear()
  .domain([0, d3.max(cp1Contributions)])
  .range([barHeight - barMargin.bottom, barMargin.top]);

const yScaleBarCP2 = d3
  .scaleLinear()
  .domain([0, d3.max(cp2Contributions)])
  .range([barHeight - barMargin.bottom, barMargin.top]);

// Étape 3 : Création des graphiques
function createBarChart(data, yScale, title, container) {
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", barWidth)
    .attr("height", barHeight);

  // Axes
  svg
    .append("g")
    .attr("transform", `translate(0, ${barHeight - barMargin.bottom})`)
    .call(d3.axisBottom(xScaleBar));

  svg
    .append("g")
    .attr("transform", `translate(${barMargin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  // Barres
  svg
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (_, i) => xScaleBar(variableLabels[i]))
    .attr("y", (d) => yScale(d))
    .attr("width", xScaleBar.bandwidth())
    .attr("height", (d) => barHeight - barMargin.bottom - yScale(d))
    .attr("fill", "steelblue");

  // Titre
  svg
    .append("text")
    .attr("x", barWidth / 2)
    .attr("y", barMargin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(title);
}

// Graphique pour CP1
createBarChart(
  cp1Contributions,
  yScaleBarCP1,
  "Contribution des variables à CP1",
  "#chart-cp1"
);

// Graphique pour CP2
createBarChart(
  cp2Contributions,
  yScaleBarCP2,
  "Contribution des variables à CP2",
  "#chart-cp2"
);

// Échelle pour les axes
const xScaleArrow = d3
  .scaleLinear()
  .domain([-1, 1]) // Les vecteurs propres sont normalisés
  .range([margin.left, width - margin.right]);

const yScaleArrow = d3
  .scaleLinear()
  .domain([-1, 1])
  .range([height - margin.bottom, margin.top]);

// Création du canevas SVG
const svgBiplot = d3
  .select("#biplot")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Ajout des axes
svgBiplot
  .append("g")
  .attr("transform", `translate(0, ${height / 2})`) // Axe X au centre
  .call(d3.axisBottom(xScaleArrow).ticks(5));

svgBiplot
  .append("g")
  .attr("transform", `translate(${width / 2}, 0)`) // Axe Y au centre
  .call(d3.axisLeft(yScaleArrow).ticks(5));

// Ajout des flèches pour les variables
variableLabels.forEach((label, i) => {
  const cp1Coord = eigenvectors[0][i]; // Coordonnée sur CP1
  const cp2Coord = eigenvectors[1][i]; // Coordonnée sur CP2

  svgBiplot
    .append("line")
    .attr("x1", xScaleArrow(0))
    .attr("y1", yScaleArrow(0))
    .attr("x2", xScaleArrow(cp1Coord))
    .attr("y2", yScaleArrow(cp2Coord))
    .each(function () {
      d3.select(this).attr("stroke", color(i));
    })
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#arrow)"); // Ajout d'une pointe de flèche

  svgBiplot
    .append("text")
    .attr("x", xScaleArrow(cp1Coord) + 5)
    .attr("y", yScaleArrow(cp2Coord) + 5)
    .text(label)
    .attr("font-size", "12px")
    .attr("fill", "black");

  svgBiplot
    .append("defs")
    .append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 6)
    .attr("refY", 5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto-start-reverse")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .each(function () {
      d3.select(this).attr("fill", "black");
    });
});

// Définition de la pointe de flèche
