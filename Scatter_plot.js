var cat_limits=[];

let scatter_artists;
let scatter_songs;
let selected_artist;
let selected_song;
//PCA FROM https://www.npmjs.com/package/pca-js

function ScatterPlotMain(data, margin, width, height, svg, this_artist) {
    

    if (this_artist) {
        //group song by artist
        //artists or artist_ids
        songByArtists_=d3.groups(data, d=>d["artists"])
        console.log("Grouped songs",songByArtists_)

        //create new matrix with for each artist 6 values that are the mean of the 
        //caetgories for each song

        //two elements: matrix_data and artist info
        songByArtists={
            "matrix_data":[],
            "info":[],
        }
        //for each artist create a new array that contains
        //the means of the categories for their songs
        for(var i=0;i<songByArtists_.length;i++){
            artist_data=[]  
            additional_data={}
            additional_data["artists"]=songByArtists_[i][0]
            for(var j=0;j<categories.length;j++){
                value_not_norm=d3.mean(songByArtists_[i][1], 
                    d=>d[categories[j]])
                value=d3.mean(songByArtists_[i][1], 
                    d=>norm_min_max(d[categories[j]], cat_limits[j][0], cat_limits[j][1]))
                artist_data.push(value)
                additional_data[categories[j]]=value_not_norm
            }
            songByArtists["matrix_data"].push(artist_data)
            //add average_categories to artist info
            songByArtists["info"].push(additional_data)

        }
        console.log("songByArtists:",songByArtists)


        //Compute new data using PCA
        artist_PCA=getPCA(songByArtists["matrix_data"])

        //add some information to each element
        for (var i = 0; i < artist_PCA.length; i++) {
            //mean of each category
            //artist_PCA[i].push(songByArtists["matrix_data"][i])
            //artist name
            artist_PCA[i].push(songByArtists["info"][i])
        }

        scatter_data=artist_PCA
    }
    else{
        console.log("Viewing songs...")
        //create a new matrix that contain all the needed data to represent each song
        //i.e. an array ofor each song with the values of the categories
        songsData=[];
        for(var i=0;i<data.length;i++){
            songData=[]
            for(var j=0;j<categories.length;j++){
                value=norm_min_max(data[i][categories[j]], cat_limits[j][0], cat_limits[j][1])
                songData.push(value)
            }
            songsData.push(songData)
        }
        console.log("songsData:",songsData)

        songsPCA=getPCA(songsData)
        
        //add some information to each element
        for (var i = 0; i < songsPCA.length; i++) {
            //song data
            songsPCA[i].push(data[i])
        }
        scatter_data=songsPCA
    }

    var xLimits=getMaxMin(scatter_data, 0)
    var yLimits=getMaxMin(scatter_data, 1)

    var category_x=0
    var category_y=1

    // Add X and Y axis
    var x = d3.scaleLinear()
    .domain([xLimits[0], xLimits[1]])
    .range([ 0, width ]);

    var y = d3.scaleLinear()
    .domain([yLimits[0],yLimits[1]])
    .range([ height, 0]);

    //axis don't indicate anything if we usa PCA, useless
    var xAxis_ = d3.axisBottom(x).ticks(0, ".0f")
    var yAxis_=d3.axisLeft(y).ticks(0, ".0f")

    var xAxis=svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .attr('id', "axis--x")
    .call(xAxis_) 

    var yAxis=svg.append("g")
    .attr('id', "axis--y")
    .call(yAxis_);

    // everything out of this area won't be drawn
    var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    // Create the scatter variable: where both the circles and the brush take place
    var scatter;
    if (this_artist) {
        scatter_artists=svg.append('g').attr("clip-path", "url(#clip)")
        scatter=scatter_artists
        }
    else {
        scatter_songs=svg.append('g').attr("clip-path", "url(#clip)")
        scatter=scatter_songs
    }



    /*
    ***************************
    INTERACTIONS
    ***************************
    */

    //BRUSHING ON BOTH AXIS

    var brush = d3.brush().extent([[0, 0], [width, height]]).on("end", brushended),
    idleTimeout,
    idleDelay = 350;

    scatter.append("g")
    .attr("class", "brush")
    .call(brush);

    function brushended(event) {

        var s = event.selection;
        if (!s) {
            if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
            x.domain(d3.extent(scatter_data, function (d) { return d[category_x]; })).nice();
            y.domain(d3.extent(scatter_data, function (d) { return d[category_y]; })).nice();
            
        } else {
            x.domain([s[0][0], s[1][0]].map(x.invert, x));
            y.domain([s[1][1], s[0][1]].map(y.invert, y));
            scatter.select(".brush").call(brush.move, null);
        }
        zoom();
    }

    function idled() {
        idleTimeout = null;
    }

    function zoom() {
        xAxis.transition().call(xAxis_);
        yAxis.transition().call(yAxis_);
        scatter.selectAll("circle").transition()
        .attr("cx", function (d) { return x(d[category_x]); })
        .attr("cy", function (d) { return y(d[category_y]); });
    }

    var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);



    //CREATE SCATTER PLOT and add interaction with mouse
    scatter
    .selectAll(".dot")
    //.data(data)
    .data(scatter_data)
    .enter()
    .append("circle")
        //.attr("cx", function (d) { return x(d[category_x]); } )
        //.attr("cy", function (d) { return y(d[category_y]); } )
        //PCA
        .attr("cx", function (d) { return x(d[category_x]); } )
        .attr("cy", function (d) { return y(d[category_y]); } )
        .attrs(base_attr)
        .styles(base_style)
        .on("click", function(d) {
            //get related data
            console.log("selected element on scatter:",d)
            
            if (this_artist) {
                console.log("selected artist:",d.originalTarget.__data__[2])
            }
            else  console.log("selected song:",d.originalTarget.__data__[2])

            updateRadialPlot(d.originalTarget.__data__[2])
            showStats(d.originalTarget.__data__[2], this_artist)
            
            
            //CLICK ON ARTIST SCATTERPLOT
            if (this_artist) {
                //now an artist is selected, not a song
                selected_artist=d.originalTarget.__data__[2]
                selected_song=null

                //select songs made by selected artist
                scatter_songs.selectAll("circle").transition().duration(100)
                .attrs(base_attr)
                .styles(base_style)

                scatter_songs.selectAll("circle")
                .filter(function(d){ 
                    song=d[2]
                    //console.log(selected_artist)
                    return song["artists"]==selected_artist["artists"]
                })
                .transition()
                //change color
                .attrs(select_attr)
                .styles(select_style)
                

                scatter_artists.
                selectAll("circle")
                .filter(function(d){
                    if(selected_artist){
                        //only non selected artists return to normal
                        artist=d[2]
                        return artist["artists"]!=selected_artist["artists"]
                    }
                    //nothing has been selected
                    return true  
                })
                .transition()
                .duration(200)
                .attrs(base_attr)
                .styles(base_style) 
            }

            //CLICK ON SONG SCATTERPLOT
            else{
                selected_song=d.originalTarget.__data__[2]
                selected_artist=d.originalTarget.__data__[2]

                //highlight artist of selected song
                scatter_artists.selectAll("circle")
                .each(function(d){
                    artist=d[2]
                    //if non selected artist stay normal
                    if (artist["artists"]!=selected_song["artists"]) {
                        d3.select(this)
                        .transition()
                        .duration(50)
                        .attrs(base_attr)
                        .styles(base_style)
                    }
                    //if selected artist then change color
                    else if (artist["artists"]==selected_song["artists"]) {
                        d3.select(this)
                        .transition()
                        .duration(50)
                        .attrs(select_attr)
                        .styles(select_style)
                    }
                
                })

                //highlight song of same artist of the selected song
                scatter_songs.selectAll("circle")
                .each(function(d){
                    song=d[2]
                    if (song["artists"]==selected_song["artists"]) {
                        //hihglight selected song
                        if (song["id"]==selected_song["id"]) {
                            d3.select(this)
                            .transition()
                            .duration(200)
                            .attrs(highlight_attr)
                            .styles(highlight_style)
                        }
                        //same artist but not selected song
                        else{
                            d3.select(this)
                            .transition()
                            .duration(200)
                            .attrs(same_artist_attr)
                            .styles(same_artist_style)
                        }

                    }
                    else{
                        d3.select(this)
                        .transition()
                        .duration(200)
                        .attrs(base_attr)
                        .styles(base_style)
                    }
                })

            }
             
        })
        .on('mouseover', function (d, i) {
            //on song scatter plot dot is highlighted only fif it not belng to selected artist  
            d3.select(this)
            .transition()
            .duration(50)
            .attrs(highlight_attr)
            .styles(highlight_style)  
            
            sel=d.originalTarget.__data__[2]
            let text_artist=sel["artists"].replace(/[\[\]\'']+/g, '').split(',')
            if (text_artist.length>1) {
                text_artist=text_artist[0]+" and others"
            }
            //Tooltip
            if (this_artist) {
                height=30+10*Math.round((text_artist.length/20))
                //console.log("artist: "+text_artist +" computed height: "+height)
                artist=sel
                div.transition()		
                    .duration(200)		
                    .style("opacity", .8);		
                div	.html( "Artist:"+ text_artist+"<br/>" )	
                    .style("left", (d.pageX+5) + "px")		
                    .style("top", (d.pageY+5) + "px")
                    //modify height
                    .style("height", (height)+"px")
            
            }
            else{
                song=sel
                //shorten song name if too long
                song_text=song["name"]
                if(song_text.length>50){
                    song_text=song_text.substring(0,50)
                    song_text=song_text+"..."
                }
                //compute height bases on how many lines of text
                height=40+20*Math.round((song_text.length/15))
                div.transition()		
                    .duration(200)		
                    .style("opacity", .8);		
                div	.html( "Song: "+ song_text+"<br/>"+
                            "Artist: "+ text_artist)	
                    .style("left", (d.pageX+5) + "px")		
                    .style("top", (d.pageY+5) + "px")
                    .style("height", (height)+"px")	
            
            }
        })

        .on('mouseout', function (d, i) {
            //events on mouse out from scatter dot
            div.transition()		
                .duration(500)		
                .style("opacity", 0);	

            //in scatter plot with songs
            if (!this_artist) {
                 //return to normal only if songs is not made by selected artist 
                scatter_songs.selectAll("circle")
                .each(function(d){
                    //console.log(d)
                    song=d[2]
                    //if an artist is selected special behaviour
                    if(selected_artist){
                        //non selected song return to normal
                        if (song["artists"]!=selected_artist["artists"]) {
                            d3.select(this)
                            .transition()
                            .duration(50)
                            .attrs(base_attr)
                            .styles(base_style)
                        }
                        //song selected remain selected
                        //difference between song selected by clicking on artist or 
                        //selection by clicking on other song of same artist
                        if (song["artists"]==selected_artist["artists"]) {
                            if (selected_song){
                                d3.select(this)
                                .transition()
                                .duration(50)
                                .attrs(same_artist_attr)
                                .styles(same_artist_style)
                            }
                            else{
                                d3.select(this)
                                .transition()
                                .duration(50)
                                .attrs(select_attr)
                                .styles(select_style)
                            }
                        }
                        //this is the song I selected, highlight in different color
                        if (selected_song && song["id"]==selected_song["id"]) {
                            d3.select(this)
                            .transition()
                            .duration(50)
                            .attrs(highlight_attr)
                            .styles(highlight_style)
                        }
                    }
                    //if no artist selected all songs return to normal
                    else{
                        d3.select(this)
                        .transition()
                        .duration(50)
                        .attrs(base_attr)
                        .styles(base_style)
                    }
                })
            }
            //mouse out on scatter plot with artists
            else {
                scatter_artists.
                selectAll("circle")
                .each(function(d){
                    //console.log(d)
                    artist=d[2]
                    if(selected_artist){     
                        //non selected artist stay normal               
                        if (artist["artists"]!=selected_artist["artists"]) {
                            d3.select(this)
                            .transition()
                            .duration(50)
                            .attrs(base_attr)
                            .styles(base_style)
                        }
                        //selected artist is highlighted if I clicked it
                        //different style if artist is selected by clicking on song
                        if (artist["artists"]==selected_artist["artists"]) {
                            if (selected_song){
                                //selected using song
                                d3.select(this)
                                .transition()
                                .duration(50)
                                .attrs(select_attr)
                                .styles(select_style)
                            }
                            else{
                                //selected using artist
                                d3.select(this)
                                .transition()
                                .duration(50)
                                .attrs(highlight_attr)
                                .styles(highlight_style)
                            }
                        }
                    }
                    //if no artist selected stay normal
                    else{
                        d3.select(this)
                        .transition()
                        .duration(50)
                        .attrs(base_attr)
                        .styles(base_style)
                    }

                })

            }
        })
        

    
}

function main() {
    const div_height = document.getElementById("scatter-plot-1").clientHeight;
    const div_width = document.getElementById("scatter-plot-1").clientWidth;

    // set the dimensions and margins of the graph
    const margin = {top: 10, right: 20, bottom: 60, left: 60},
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

    //Read the data and plot the plots
    d3.csv("../tracks_small.csv",d3.autoType)
        .then( function(data){ 
            //get max and min for categories of radial plot (to nromalize)
            for(var i=0;i<categories.length;i++){
                limits=getMaxMin(data, categories[i]) //limits[0] is min, limits[1] is max
                cat_limits.push(limits)
            }
            console.log("limits:",cat_limits)
            ScatterPlotMain(data, margin, width, height, svg1, false)
            ScatterPlotMain(data, margin, width, height, svg2, true)

            radialPlotMain()
            
            })
        .catch((error) => console.log(error))
}

main();
