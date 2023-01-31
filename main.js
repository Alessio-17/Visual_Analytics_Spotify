
const categories = ["tempo","danceability","liveness","energy","valence","loudness",
"acousticness","instrumentalness","speechiness"]

let K_nearest=5;

function main() {
    const div_height = document.getElementById("scatter-plot-1").clientHeight;
    const div_width = document.getElementById("scatter-plot-1").clientWidth;
    
    // set the dimensions and margins of the graph
    const margin = {top: 10, right: 20, bottom: 20, left: 20},
    width = div_width - margin.left - margin.right,
    height = div_height - margin.top - margin.bottom;
    
    // append the svg object to the body of the page
    const svg1 = d3.select("#scatter-plot-1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const svg2 = d3.select("#scatter-plot-2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const filterBar = document.getElementById("filter-bar");

    const innerArtistsColorKey = `
        <div>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <div id="circle" style="background-color: green; opacity: 1; border: 2px solid black; width: 10px; height: 10px; border-radius: 100%; margin: 0 5px;"></div>
                <span>: Highlighted artist</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <div id="circle" style="background-color: #d73027; opacity: 1; border: 2px solid black; width: 10px; height: 10px; border-radius: 100%; margin: 0 5px;"></div>
                <span>: Selected artist</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <div id="circle" style="background-color: #FF66D8; opacity: 1; border: 2px solid black; width: 10px; height: 10px; border-radius: 100%; margin: 0 5px;"></div>
                <span>: Artist whose song is selected</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <div id="circle" style="background-color: #984ea3; opacity: 1; border: 2px solid black; width: 10px; height: 10px; border-radius: 100%; margin: 2px 5px; flex-shrink: 0; align-self: flex-start;"></div>
                <span style="margin-left: 0px; text-align: left;">: Co-author of the selected song</span>
            </div>
        </div>
    `
    const innerSongsColorKey = `
        <div>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <div id="circle" style="background-color: green; opacity: 1; border: 2px solid black; width: 10px; height: 10px; border-radius: 100%; margin: 0 5px;"></div>
                <span>: Highlighted song</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <div id="circle" style="background-color: #d73027; opacity: 1; border: 2px solid black; width: 10px; height: 10px; border-radius: 100%; margin: 0 5px;"></div>
                <span>: Selected song</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <div id="circle" style="background-color: #FF66D8; opacity: 1; border: 2px solid black; width: 10px; height: 10px; border-radius: 100%; margin: 0 5px;"></div>
                <span>: Songs made by selected artist</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <div id="circle" style="background-color: grey; opacity: 1; border: 2px solid red; width: 10px; height: 10px; border-radius: 100%; margin: 2px 5px; flex-shrink: 0; align-self: flex-start;"></div>
                <span style="margin-left: 0px; text-align: left;">: Other songs made by the selected artist</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <div id="circle" style="background-color: #984ea3; opacity: 1; border: 2px solid black; width: 10px; height: 10px; border-radius: 100%; margin: 2px 5px; flex-shrink: 0; align-self: flex-start;"></div>
                <span style="margin-left: 0px; text-align: left;">: Songs in which selected artist featured as a co-artist</span>
            </div>
        </div>
    `

    const artistsColorKey = document.getElementById("artists-color-key");
    artistsColorKey.addEventListener('mouseover', (event) => {
        tooltip_div.transition()		
            .duration(200)		
            .style("opacity", 1);                    	
        tooltip_div.html(innerArtistsColorKey)
            .style("width", 250 + "px")
            .style("left", (event.clientX+5-250) + "px")		
            .style("top", (event.clientY+5) + "px");
    })
    artistsColorKey.addEventListener("mouseout", (event) => {
        tooltip_div.transition()		
            .duration(500)		
            .style("opacity", 0);	
    })
    const songsColorKey = document.getElementById("songs-color-key");
    songsColorKey.addEventListener('mouseover', (event) => {
        tooltip_div.transition()		
            .duration(200)		
            .style("opacity", 1);                    	
        tooltip_div.html(innerSongsColorKey)
            .style("width", 250 + "px")
            .style("left", (event.clientX+5-250) + "px")		
            .style("top", (event.clientY+5) + "px");
    })
    songsColorKey.addEventListener("mouseout", (event) => {
        tooltip_div.transition()		
            .duration(500)		
            .style("opacity", 0);	
    })

    const statsHeader = document.getElementById("stats-h3");
    statsHeader.addEventListener('mouseover', (event) => {
        tooltip_div.transition()		
            .duration(200)		
            .style("opacity", 1);                    	
        tooltip_div.html("This section reports the statistics of the selected song and the 5 most similar songs. Each song is associated to a color, which is always the same in every graph. If one song is particularly interesting, by clicking on its stats it's possible to find songs similar to that one.")
            .style("width", 250 + "px")
            .style("left", (event.clientX+5) + "px")		
            .style("top", (event.clientY+5) + "px");
    })
    statsHeader.addEventListener("mouseout", (event) => {
        tooltip_div.transition()		
            .duration(500)		
            .style("opacity", 0);	
    })

    const radialHeader = document.getElementById("radial-h3");
    radialHeader.addEventListener('mouseover', (event) => {
        tooltip_div.transition()		
            .duration(200)		
            .style("opacity", 1);                    	
        tooltip_div.html("If a song is selected, this graph shows the values of its statistics and those of the five songs most similar to that. If an artist is selected, it shows the average values of the statistics of all their songs, and those of the five artists most similar to that.")
            .style("width", 250 + "px")
            .style("left", (event.clientX+5) + "px")		
            .style("top", (event.clientY+5) + "px");
    })
    radialHeader.addEventListener("mouseout", (event) => {
        tooltip_div.transition()		
            .duration(500)		
            .style("opacity", 0);	
    })

    const boxHeader = document.getElementById("box-h3");
    boxHeader.addEventListener('mouseover', (event) => {
        tooltip_div.transition()		
            .duration(200)		
            .style("opacity", 1);                    	
        tooltip_div.html("This graph shows the aggregated values of the statistics of the selected artist or the artist that made the selected song.")
            .style("width", 250 + "px")
            .style("left", (event.clientX+5) + "px")		
            .style("top", (event.clientY+5) + "px");
    })
    boxHeader.addEventListener("mouseout", (event) => {
        tooltip_div.transition()		
            .duration(500)		
            .style("opacity", 0);	
    })


    //Click on stat box
    document.getElementById("1-stats")
    .addEventListener("click", function(){
        console.log("clicchetto 1")
        if(nearest_elements) {
            let this_artist=true
            if(selected_song) this_artist=false
            onClick(this_artist,nearest_elements[0].data)
        }          
    })  
    document.getElementById("2-stats")
    .addEventListener("click", function(){
        console.log("clicchetto 2")
        if(nearest_elements) {
            let this_artist=true
            if(selected_song) this_artist=false
            onClick(this_artist,nearest_elements[1].data)
        }          
    })   
    document.getElementById("3-stats")
    .addEventListener("click", function(){
        console.log("clicchetto 3")
        if(nearest_elements) {
            let this_artist=true
            if(selected_song) this_artist=false
            onClick(this_artist,nearest_elements[2].data)
        }          
    })   
    document.getElementById("4-stats")
    .addEventListener("click", function(){
        console.log("clicchetto 4")
        if(nearest_elements) {
            let this_artist=true
            if(selected_song) this_artist=false
            onClick(this_artist,nearest_elements[3].data)
        }          
    }) 
    document.getElementById("5-stats")
    .addEventListener("click", function(){
        console.log("clicchetto 5")
        if(nearest_elements) {
            let this_artist=true
            if(selected_song) this_artist=false
            onClick(this_artist,nearest_elements[4].data)
        }          
    })       

    // Dark or light mode toggle
    const toggle = document.getElementById("dark-mode-toggle");
    const colorHierarchy = document.getElementById("color-hierarchy");
    toggle.addEventListener("click", function() {
        document.getElementsByTagName("body")[0].classList.toggle("dark-mode");
        if (document.getElementsByTagName("body")[0].classList.contains("dark-mode")) {
            colorHierarchy.src = "images/selected_and_hierarchy_dark.jpg";
            toggle.src = "images/light-mode.png"
        }
        else {
            colorHierarchy.src = "images/selected_and_hierarchy.jpg";
            toggle.src = "images/dark-mode.png"
        }
    })
    


    //Read the data and plot the plots
    d3.csv("datasets/tracks_mid_1k.csv",d3.autoType)
        .then( function(data){ 
            console.log("data loaded")
            //get max and min for categories of radial plot (to nromalize)
            for(var i=0;i<categories.length;i++){
                const limits=getMaxMin(data, categories[i]) //limits[0] is min, limits[1] is max
                cat_limits.push(limits)
                cat_mu_std.push(getMuStd(data, categories[i]))
            }

            // Initialize filters
            for (cat of categories) {
                const nameContainer = document.createElement("div");
                nameContainer.classList.add("filter-name-container");

                const limits = document.createElement("span");
                limits.classList.add("filter-limits");
                limits.id = `${cat}-limits`;

                let description = "";
                if (cat == "acousticness") {
                    description = "<span style=\"font-weight: bold\">Acousticness</span> is a confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic."
                }
                else if (cat == "danceability") {
                    description = "<span style=\"font-weight: bold\">Danceability</span> describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0.0 is least danceable and 1.0 is most danceable."
                }
                else if (cat == "energy") {
                    description = "<span style=\"font-weight: bold\">Energy</span> is a measure from 0.0 to 1.0 and represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. For example, death metal has high energy, while a Bach prelude scores low on the scale. Perceptual features contributing to this attribute include dynamic range, perceived loudness, timbre, onset rate, and general entropy."
                }
                else if (cat == "instrumentalness") {
                    description = "<span style=\"font-weight: bold\">Instrumentalness</span> predicts whether a track contains no vocals. \"Ooh\" and \"aah\" sounds are treated as instrumental in this context. Rap or spoken word tracks are clearly \"vocal\". The closer the instrumentalness value is to 1.0, the greater likelihood the track contains no vocal content. Values above 0.5 are intended to represent instrumental tracks, but confidence is higher as the value approaches 1.0."
                }
                else if (cat == "liveness") {
                    description = "<span style=\"font-weight: bold\">Liveness</span> detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 provides strong likelihood that the track is live."
                }
                else if (cat == "loudness") {
                    description = "The overall <span style=\"font-weight: bold\">loudness</span> of a track in decibels (dB). Loudness values are averaged across the entire track and are useful for comparing relative loudness of tracks. Loudness is the quality of a sound that is the primary psychological correlate of physical strength (amplitude). Values typically range between -60 and 0 db."
                }
                else if (cat == "speechiness") {
                    description = "<span style=\"font-weight: bold\">Speechiness</span> detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value. Values above 0.66 describe tracks that are probably made entirely of spoken words. Values between 0.33 and 0.66 describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 0.33 most likely represent music and other non-speech-like tracks."
                }
                else if (cat == "tempo") {
                    description = "The overall estimated <span style=\"font-weight: bold\">tempo</span> of a track in beats per minute (BPM). In musical terminology, tempo is the speed or pace of a given piece and derives directly from the average beat duration."
                }
                else if (cat == "valence") {
                    description = "<span style=\"font-weight: bold\">Valence</span> is a measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry)."
                }
                const filterName = document.createElement("div");
                filterName.innerHTML = `${capitalize(cat)} <img class="question-mark" src="images/question-mark-on-a-circular-black-background.png" alt="Question Mark Icon">`;
                filterName.style.fontWeight = "bold";
                filterName.classList.add("filter-name");
                filterName.addEventListener('mouseover', (event) => {
                    tooltip_div.transition()		
                        .duration(200)		
                        .style("opacity", 1);                    	
                    tooltip_div.html(description)
                        .style("width", 250 + "px")
                        .style("left", (event.clientX+5) + "px")		
                        .style("top", (event.clientY+5) + "px");
                })
                filterName.addEventListener("mouseout", (event) => {
                    tooltip_div.transition()		
                        .duration(500)		
                        .style("opacity", 0);	
                })

                const filterContainer = document.createElement("div");
                filterContainer.classList.add("filter-container");
                filterContainer.id = `${cat}-filter-container`;

                nameContainer.appendChild(limits);
                nameContainer.appendChild(filterName);
                filterBar.appendChild(nameContainer)
                filterBar.appendChild(filterContainer);

                createHistogram(data, cat, applyFilter);

                filterLimits[cat] = getMaxMin(data, cat);
            }

            if (filterLimits['tempo'] > 220) alert("Trovata una canzone con tempo > 220, sistemare l'istogramma dei filtri")

            console.log("limits:",cat_limits)

            // Building searchArray for the searchbar
            
            for (el of data) {
                searchArray.push(el)
            }
            
            console.log("changing artists")
            for(var id=0; id<data.length;id++){
                //if a song has more than one artist, remove the other
                //console.log(data[id].artists)
                let artists=parseArtists(data[id].artists)
                data[id]["co_artists"]=[]
                data[id].artists=artists[0]
                if(artists.length>1){
                    for(var i=1;i<artists.length;i++){
                        data[id]["co_artists"].push(artists[i])
                    }
                    //console.log(data[id])
                }

            }
            


            console.log("plot ready")
            ScatterPlotMain(data, margin, width, height, svg1, false)
            ScatterPlotMain(data, margin, width, height, svg2, true)

            radialPlotMain()
            boxPlotMain()
            //similarityPlot()
            
            })
        .catch((error) => console.log(error))
}

main();
