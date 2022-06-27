function createHistogram(data, cat, update) {
    const div_height = document.getElementById("filter-container").clientHeight;
    const div_width = document.getElementById("filter-container").clientWidth;

    // set the dimensions and margins of the histogram
    const margin = {top: 10, right: 10, bottom: 25, left: 25},
    width = div_width - margin.left - margin.right,
    height = div_height - margin.top - margin.bottom;

    let lowLimit;
    let topLimit;

    const svg = d3.select("#filter-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // On the x axis we have the values for the speechiness
        // they go from 0 to 1
        let x = d3.scaleLinear()
            .domain([0, 1])
            .range([0, width]);
        
        svg.append("g")
            .call(d3.axisBottom(x))
            .attr("transform", function(d) {
                return `translate(0, ${height})`
            });

        let binsNum = 20;

        // I want the histogram to show the distribution of values between 0 and 1
        // So if there are no more values greater than the maximum of a category, I want to show it
        let histogram = d3.histogram()
            .value(function(d) { return d[cat] })
            .domain(x.domain())
            .thresholds(x.ticks(20));

        let bins = histogram(data);
        let histArr = getHistValues(data, binsNum, cat);

        // the y axis represents the number of samples that have value for that
        // category in the bin
        let y = d3.scaleLinear()
            .domain([0, d3.max(histArr)])
            .range([height, 0]);

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.selectAll("rect")
            .data(bins)
            .enter()
            .append("rect")
                .attr("x", 1)
                .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
                .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
                .attr("height", function(d) { return height - y(d.length); })
                .style("fill", "#69b3a2");

        let brushLabelL = svg.append("text")
                    .attr("id", "brush-label-L")
                    .attr("x", 0)
                    .attr("y", height+25)

        let brushLabelR = svg.append("text")
                    .attr("id", "brush-label-R")
                    .attr("x", 0)
                    .attr("y", height+25)

        let brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("brush", function(event) {
                let s = event.selection;

                // this is to avoid the execution of the following code when the brush is automatically resized to a prefixed value
                // without it it would keep looping because every resize generates a new brush event
                if (!event.sourceEvent) return;

                lowLimit = round2Bin(x.invert(s[0]), binsNum);
                topLimit = round2Bin(x.invert(s[1]), binsNum);

                // update and move labels
                brushLabelL
                    .attr("x", s[0])
                    .text(`${lowLimit}`)
                brushLabelR
                    .attr("x", s[1])
                    .text(`${topLimit}`)

                // moving the brush to one of the bins
                d3.select(this).call(brush.move, [lowLimit, topLimit].map(x))
            })
            .on("end", function(event) {
                console.log(`I valori sono: ${lowLimit}, ${topLimit}`)
                update(lowLimit, topLimit, cat)
            })
            /*
            .on("dblclicked", function(event) {
                
            })*/

        svg.append("g")
            .attr("class", "brush")
            .call(brush)

    return lowLimit, topLimit;
}