document.addEventListener('DOMContentLoaded', () => {

    const svg = d3.select("#metro-map");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const padding = 50;

    // Tooltip-Element erstellen
    const tooltip = d3.select("#tooltip");
    let hideTooltipTimeout; // Variable, um das Ausblenden zu steuern

    // Isometrische Projektionsfunktion
    function isometricProjection(coords) {
        const [x, y, z] = coords;
        const scale = 2.5;
        const offsetX = width / 2;
        const offsetY = height / 2;

        const isoX = (x - z) * Math.cos(Math.PI / 6) * scale;
        const isoY = (y + z) * Math.sin(Math.PI / 6) * scale;

        return [isoX + offsetX, isoY + offsetY];
    }

    // Daten laden und verarbeiten
    d3.json("data.json").then(data => {
        // Hier ist der entscheidende Teil, der die Schleife über die Daten erstellt
        svg.selectAll(".line-group")
            .data(data.lines)
            .enter()
            .append("g")
            .attr("class", "line-group")
            .each(function(line) {
                const pathData = line.stations.map(station => {
                    return isometricProjection(station.coords);
                });

                // Linie zeichnen
                const lineGenerator = d3.line()
                    .x(d => d[0])
                    .y(d => d[1])
                    .curve(d3.curveCardinal);

                d3.select(this).append("path")
                    .datum(pathData)
                    .attr("class", "line")
                    .attr("d", lineGenerator)
                    .style("stroke", line.color)
                    .style("stroke-width", "10px");

                // Stationen zeichnen
                d3.select(this).selectAll(".station-group")
                    .data(line.stations)
                    .enter()
                    .append("g")
                    .attr("class", "station-group")
                    .attr("transform", d => {
                        const [x, y] = isometricProjection(d.coords);
                        return `translate(${x},${y})`;
                    })
                    .each(function(d) {
                        d3.select(this).append("circle")
                            .attr("r", 8)
                            .attr("class", "station-circle")
                            .on("mouseover", (event, d) => {
                                clearTimeout(hideTooltipTimeout);
                                // Holen Sie die Position der Station auf dem Bildschirm
                                const [x, y] = isometricProjection(d.coords);

                                let tooltipContent = `<strong>${d.name}</strong><br>${d.info}`;
                                if (d.link) {
                                    tooltipContent += `<br><a href="${d.link}" target="_blank">Weitere Infos</a>`;
                                }
                                tooltip.style("opacity", 1)
                                    .html(tooltipContent)
                                    .style("left", `${x}px`)
                                    .style("top", `${y + 10}px`);
                            })
                            .on("mouseout", () => {
                                // Erhöhte Verzögerung von 500ms
                                hideTooltipTimeout = setTimeout(() => {
                                    tooltip.style("opacity", 0);
                                }, 500);
                            });

                        d3.select(this).append("text")
                            .attr("class", "station-label")
                            .attr("dy", -15)
                            .text(d => d.name);
                    });
            });
            
        // Handler für das Pop-up selbst, um das Ausblenden zu verhindern
        tooltip
            .on("mouseenter", () => {
                clearTimeout(hideTooltipTimeout);
            })
            .on("mouseleave", () => {
                tooltip.style("opacity", 0);
            });

    }).catch(error => {
        console.error("Fehler beim Laden der Daten:", error);
    });
});