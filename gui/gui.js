
		var controlbox_width = width,
			controlbox_height = 0.8*plot_height,
			n_grid_x = 24, // these two variables
			n_grid_y = 12; // are used for putting a grid on the controls panels
	

		// this is the svg for the controls
		
		var controls = d3.selectAll("#control_container").append("svg")
			.attr("width",controlbox_width)
			.attr("height",controlbox_height)
			.attr("class","explorable_widgets");
			//.style("border","1px solid black")


		// this defines a grid, only used for making it easier to place widgets
		// kind of a simple integer internal coordinate system
		
		var g = widget.grid(controlbox_width,controlbox_height,n_grid_x,n_grid_y);

		var anchors = g.lattice(); // g has a method that returns a lattice with x,y coordinates

		// here we draw the lattice (usually not done in production)
/*

		controls.selectAll(".grid").data(anchors).enter().append("circle")
			.attr("class","grid")
			.attr("transform",function(d){return "translate("+d.x+","+d.y+")"})
			.attr("r",1)
			.style("fill","black")
			.style("stroke","none")
*/

		///////////////////
		// buttons
		///////////////////

		// we first define the button parameters

		var b4 = { id:"b4", name:"", actions: ["pause","play"], value: 0};
		var b5 = { id:"b5", name:"", actions: ["rewind"], value: 0};

		// values of these parameters are changed when the widget is activated

		// now we generate the button objects and put them into an array, the last button is modified a bit from its default values

		var buttons = [
			widget.button(b4).size(60).symbolSize(30).update(function(d){
        if (b4.value == 0)
        {
          start_ising(); 
          start_fourier();
      f }
        else
        {
          stop_ising(); 
          stop_fourier();
        }
      }),
			widget.button(b5).size(60).symbolSize(30).update(function(d){
        reset();
        sliders[0].click(T);
      }),
		]
		// now we define a block in the control panel where the buttons should be placed

		var buttonbox = g.block({x0:2.5,y0:4,width:4.5,height:0}).Nx(buttons.length);

		// now we draw the buttons into their block

		controls.selectAll(".button").data(buttons).enter().append(widget.buttonElement)
			.attr("transform",function(d,i){return "translate("+buttonbox.x(i)+","+buttonbox.y(0)+")"});	


		///////////////////
		// toggles
		///////////////////
/*

		// we first define the toggle parameters

		var t4 = {id:"t4", name: "generate new for each change",  value: !use_growing_occupation };
		var use_log_y = {id:"t3", name: "histogram log-y",  value: true };
		var use_log_x = {id:"t2", name: "histogram log-x",  value: true };


		// now the array of toggle objets

		var toggles = [
			widget.toggle(t4).label("right").update(function(d){
          use_growing_occupation = !use_growing_occupation;
          create_a_new_one();
      }),
			widget.toggle(use_log_y).label("right").update(function(d){
          if (use_log_y.value)
            h_pl.yscale("log");
          else
            h_pl.yscale("lin");
          plot_component_histogram();
      }),
			widget.toggle(use_log_x).label("right").update(function(d){
          if (use_log_x.value)
            h_pl.xscale("log");
          else
            h_pl.xscale("lin");
          plot_component_histogram();
      }),
		]

		// here comes the block for the toggles

		var togglebox = g.block({x0:10,y0:1.5,width:4,height:3}).Ny(toggles.length);

		// and here we att them to the panel

		controls.selectAll(".toggle").data(toggles).enter().append(widget.toggleElement)
			.attr("transform",function(d,i){return "translate("+togglebox.x(0)+","+togglebox.y(i)+")"});	
*/


		///////////////////
		// sliders
		///////////////////	

		var x3 = {id:"ghult", name: "temperature", range: [1,5], value: T};


		var sliders = [
			widget.slider(x3).update(function(){
        T = x3.value; 
        d3.selectAll("#T-show").text("T = "+d3.format(".2f")(T));
        reset_fourier();
      })
		]

		var sliderbox = g.block({x0:1,y0:8,width:22,height:1}).Ny(2);

		sliders.forEach(function(d){
			d.width(sliderbox.w())
		})


		controls.selectAll(".slider").data(sliders).enter().append(widget.sliderElement)
			.attr("transform",function(d,i){return "translate("+sliderbox.x(0)+","+sliderbox.y(i)+")"});	
    controls.append("text")
        .attr("id","T-show")
        .attr("x",sliderbox.x(0))
        .attr("y",sliderbox.y(2.5))
        .attr("style",'font-size: 18; font-family: Helvetica, Arial, sans-serif')
        .text("T = "+d3.format(".2f")(T))
      ;
    

		var r2 = {id:"r2", name:"local field", choices: ["no local field at cursor","positive local field at cursor","negative local field at cursor"], value:0,
              labelColors:["#000",colors[1], colors[0]]};
    local_field = "none";

		var radios = [
			widget.radio(r2).label("left").shape("round").update(function(){
        if (r2.value == 0)
          local_field = "none";
        else if (r2.value == 1)
          local_field = "positive";
        else if (r2.value == 2)
          local_field = "negative";
      }),
		]

    

		var radiobox  = g.block({x0:22,y0:0.5,width:3,height:5}).Nx(3);
	

		radios.forEach(function(d){
			d.size(radiobox.h())
		})

		controls.selectAll(".radio").data(radios).enter().append(widget.radioElement)
			.attr("transform",function(d,i){return "translate("+radiobox.x(i)+","+radiobox.y(0)+")"});	
