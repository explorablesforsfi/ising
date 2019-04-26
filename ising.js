// some debugging function
let show_runtime = false;

function run_function_and_measure_runtime(func,name)
{
    let t0 = performance.now();

    func();

    let t1 = performance.now();

    if (show_runtime)
        console.log("function " + name +" needed " + (t1-t0)+ " milliseconds");
    
}

// nicer display on retina
function retina(canv,cont,w,h)
{
  if (window.devicePixelRatio){
      canv
          .attr('width', w * window.devicePixelRatio)
          .attr('height', h * window.devicePixelRatio)
          .style('width', w + 'px')
          .style('height', h + 'px');

      cont.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
}

function histogram(sizes)
{
    let hist = {};
    sizes.forEach(function(s){
        if (!hist.hasOwnProperty(s))
            hist[s] = 1;
        else
            hist[s]++;
    });
    let x = [];
    let y = [];
    Reflect.ownKeys(hist).forEach(function(key){
        x.push(+key);
        y.push(+hist[key]);
    });
    return { 'x': x, 'y': y };
}


// explorable definitions
//
var use_growing_occupation = true;
var sites = [];               // one-dimensional array containing all sites (1 if occupied, 0 if not)
let pixel_width = 3;          // width of one site in pixels 
let flipped_spins = {};
let use_2d_fourier = false;
var local_field = "none";

 
let T = 2.0,               // occupation probability 
    sidelength = 128;           // how many sites per side of the square

let N = sidelength*sidelength; // total number of sites
let n_clusters = 0;            // current number of clusters
let color = d3.scaleOrdinal(d3.schemeDark2); // colorscheme
let colors = d3.range(8).map(tmp => color(tmp));
colors[1] = d3.color(colors[1]).brighter().brighter().hex();

var width = sidelength*pixel_width,   // canvas width
    height = sidelength*pixel_width;  // canvas height
var plot_width = width/2, plot_height=width/2;
var canvas = d3.select('#ising_container')
               .append('canvas')
               .attr('width', width)
               .attr('height', height);

var ctx = canvas.node().getContext('2d');
var transform = d3.zoomIdentity;

retina(canvas,ctx,width,height);

// ============== ising functions ===============

/*
function initialize_ising_canvas() {
    canvas
        //.call(d3.drag().subject(dragsubject).on("drag", dragged))
        .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed))
        .call(draw);
}
*/
let mouseX = -1,
    mouseY = -1;

canvas.on('mouseout', function () {
          mouseX = -1;
          mouseY = -1;
      })
      .on('mousemove', function () {
          mouseX = d3.event.layerX || d3.event.offsetX;
          mouseY = d3.event.layerY || d3.event.offsetY;
      })

function zoomed() {
transform = d3.event.transform;
draw();
}

var maintimer;
var plottimer;

function start_ising() {
  init();
  maintimer = d3.timer(function(elapsed) {
    update();
    draw_updated();
    //maintimer.stop();
  });
  plottimer = d3.interval(function(elapsed) {
    analyze_magnetization();
    plot_magnetization();
  },100);
}

function stop_ising()
{
  maintimer.stop();
  plottimer.stop();
}

function reset()
{
  //stop_ising();
  T = 2;
  m_x_minus.length = 0;
  m_y_minus.length = 0;
  m_x_plus.length = 0;
  m_y_plus.length = 0;
  reset_fourier();
  init();
  analyze_magnetization();
  plot_magnetization();
  //start_ising();
}

function update() {
  flipped_spins = {};
  for(let i=0; i<N; i++)
  {
    let I = Math.floor(Math.random()*N);
    let s_xy = sites[I];
    let pos = coords(I);
    let x = pos[0];
    let y = pos[1];
    let S = 0;
    for(let dr = -1; dr<2; dr += 2)
    {
      let _x = 0;
      let _y = dr;
      S += sites[index(x+_x,y+_y)];

      _x = dr;
      _y = 0;
      S += sites[index(x+_x,y+_y)];
    }
    let dE = 2*s_xy*S;
    if ((dE < 0) || (Math.random() < Math.exp(-dE/T)))
    {
      sites[I] *= -1;
      flipped_spins[I] = { x:x, y:y, s: -s_xy}
    }
  }
  if ((local_field != "none") && (mouseX>-1))
  {
    let x = Math.floor(mouseX/pixel_width),
        y = Math.floor(mouseY/pixel_width);
    let spin;
    if (local_field == "positive")
      spin = +1;
    if (local_field == "negative")
      spin = -1;

    let radius = 5;


    for (let _x = x - radius; _x <= x+radius; ++_x)
      for (let _y = y - radius; _y <= y+radius; ++_y)
      {
        if (Math.sqrt(Math.pow(_x - x,2)+Math.pow(_y - y,2))<radius)
        {  
          let I = index(_x,_y);
          let pos = coords(I);
          sites[I] = spin;
          flipped_spins[I] = { x:pos[0], y:pos[1], s: spin}
        }
      }

  }

}
function draw() {
    ctx.save();

    // delete all that was drawn
    let bg_val = 0;
    ctx.fillStyle = "rgb("+bg_val+","+bg_val+","+bg_val+")";
    ctx.fillRect( 0, 0, width, height );
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // draw the sites according to their clusters
    for(let x = 0; x < sidelength; x++)
    {
      for(let y = 0; y < sidelength; y++)
      {
        ctx.fillStyle = colors[(sites[index(x,y)]+1)/2];
        ctx.fillRect( x*pixel_width, y*pixel_width, pixel_width, pixel_width );
      }
    }

    ctx.restore();

}

function draw_updated() {
    ctx.save();

    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    Reflect.ownKeys(flipped_spins).forEach(function (key) {
      let site = flipped_spins[key];
      ctx.fillStyle = colors[(site.s+1)/2];
      ctx.fillRect( site.x*pixel_width, site.y*pixel_width, pixel_width, pixel_width );
    });

    ctx.restore();
}

function index(i,j){
    if (i<0)
        i += sidelength;
    if (j<0)
        j += sidelength;
    return (i%sidelength) * sidelength + (j%sidelength);
}


function coords(i){
    return [ Math.floor(i/sidelength), i%sidelength ];
}

function init(){
    sites.length = 0;
    let p = 0.95;

    for(let i=0; i<sidelength; i++)
    {
        for(let j=0; j<sidelength; j++)
        {
            if (Math.random() < p)
                sites.push(1);
            else
                sites.push(-1);
        }
    }
    draw();
}

// ================= plot Magnetization ===========
//
//
var magnetization_canvas = d3.select('#magnetization_container')
  .append('canvas')
  .attr('width', plot_width)
  .attr('height', plot_height);

var m_ctx = magnetization_canvas.node().getContext('2d');
retina(magnetization_canvas,m_ctx,plot_width,plot_height);
var m_pl = new simplePlot(m_ctx,plot_width,plot_height,{margin:30,fontsize:14,fastScatter:true});
m_pl.xlabel('temperature');
m_pl.ylabel('magnetization');
m_pl.xlimlabels(['1','5']);
m_pl.ylimlabels(['-1','+1']);
m_pl.xlim([1,5]);
m_pl.ylim([-1,1]);
var m_x_plus = [];
var m_y_plus = [];
var m_x_minus = [];
var m_y_minus = [];
var M;

function analyze_magnetization()
{
  M = d3.mean(sites);
  if (M >= 0)
  {
    m_x_plus.push(T);
    m_y_plus.push(M);
  }
  else
  {
    m_x_minus.push(T);
    m_y_minus.push(M);
  }

}

function plot_magnetization()
{
  let plus_color = colors[1];
  //let plus_color = d3.color(colors[1]);
  //plus_color.opacity = 0.3;
  //plus_color = plus_color.toString();
  let minus_color = colors[0];
  //let minus_color = d3.color(colors[0]);
  //minus_color.opacity = 0.3;
  //minus_color = minus_color.toString();

    if (m_x_plus.length > 0)
      m_pl.scatter('plus',m_x_plus,m_y_plus,{marker:'s',markercolor:plus_color,markerradius:2},false);
    if (m_x_minus.length > 0)
      m_pl.scatter('minus',m_x_minus,m_y_minus,{marker:'s',markercolor:minus_color,markerradius:2},false);
    m_pl.scatter('systemmarker',[T],[M],{marker:'o',markercolor:'rgba(255,255,255,0.0)', markerradius:10,markeredgewidth:1,markeredgecolor:'rgba(102,102,102,1.0)'},false);
    m_pl.plot('zero',[1,5],[0,0])
}


// =================== FOURIER ANALYSIS 2D CORRELATION LENGTH =====================
//
let corr_length = [];
let corr_length_2d = [];
let mean_corr_length = d3.range(N).map(s => 0.0);
let fourier_measurements = 0;
let last_corr_lengths = [];
let max_measurements = 20;

function compute_correlation_length() {
  let h_hat = [];
  let dims = [ sidelength, sidelength ];

  // transform
  Fourier.transform(sites, h_hat);


  // manipulate
  for(let i=0; i<h_hat.length;++i)
  {
      h_hat[i].real = Math.pow(h_hat[i].real,2) + Math.pow(h_hat[i].imag,2);
      h_hat[i].imag = 0.0;
  }

  // invert
  corr_length_2d = [];
  Fourier.invert(h_hat, corr_length_2d);
  /*

  //corr_length = x_corr_length.map(c => c);
  for(let j=0; j<sidelength/2; ++j)
  {
      let initial = corr_length_2d[index(0,j)];
    for(let i=sidelength-1; i>=0; --i)
    {
        //corr_length[index(i,j)] = x_corr_length[index(i,j)];
        corr_length_2d[index(i+1,j)] = corr_length_2d[index(i,j)];      
    }
    corr_length_2d[index(sidelength-1,j)] = initial;
  }
  */
 
  //console.log(corr_length);
  //
  //fourier_measurements += 1;
  //console.log(mean_corr_length.length);
  //mean_corr_length = corr_length.map(function(c, i) { 
  //     return mean_corr_length[i]*(fourier_measurements-1)/fourier_measurements 
  //            + c/fourier_measurements;
  //});
}
function compute_correlation_length_1d() {

  corr_length = d3.range(sidelength).map(tmp=>0);
  for (var row=0; row<sidelength; row++)
  {
    for (var col=0; col<sidelength; col++)
      corr_length[row] += corr_length_2d[index(row,col)]/sidelength;
  }

  // flip such that the circle is in the center
  //corr_length = Fourier.halfshift(Fourier.halfshift(corr_length,dims),dims);
  //corr_length = x_corr_length.map(c => c);
  //let tmp = [];
  //for(var i=sidelength/2; i<sidelength; ++i)
  //  tmp.push(corr_length[i]);
  //for(var i=0; i<sidelength/2; ++i)
  //  tmp.push(corr_length[i]);
  //corr_length = tmp;
  
  corr_length = corr_length.slice(0,sidelength/2);
  last_corr_lengths.push(corr_length);
  if (last_corr_lengths.length > max_measurements)
    last_corr_lengths = last_corr_lengths.slice(1,last_corr_lengths.length);

}
 
  //console.log(corr_length);

function reset_fourier()
{
  if (use_2d_fourier)
  {
    mean_corr_length = sites.map(s => 0.0);
    fourier_measurements = 0;
  }
  else
  {
    last_corr_lengths.length = 0;
  }
}

var corr_timer;

function start_fourier()
{
  if (use_2d_fourier)
  {
    corr_timer = d3.interval(function(){
    },250);
  }
  else
  {
    corr_timer = d3.interval(function(){
        compute_correlation_length();
        compute_correlation_length_1d();
        draw_corr_1d();
        //corr_timer.stop();
    },100);
  }
}

function stop_fourier()
{
  corr_timer.stop();
}

if (use_2d_fourier)
{
  var corr_canvas = d3.select('#correlation_container')
                      .append('canvas')
                      .attr('width', width)
                      .attr('height', height);

  var corr_ctx = corr_canvas.node().getContext('2d');
  retina(corr_canvas,corr_ctx,width,height);

  start_fourier();
}
else
{
  var corr_canvas = d3.select('#correlation_container')
                      .append('canvas')
                      .attr('width', plot_width)
                      .attr('height', plot_height)
  ;

  var corr_ctx = corr_canvas.node().getContext('2d');
  retina(corr_canvas,corr_ctx,plot_width,plot_height);

  var corr_pl = new simplePlot(corr_ctx,plot_width,plot_height,{margin:30,fontsize:14});
  //corr_pl.xscale("log");
  //corr_pl.yscale("log");
  corr_pl.ylimlabels(['','']);
  corr_pl.xlabel('distance to neighbor');
  corr_pl.ylabel('correlation');
  corr_pl.xlimlabels(['0','L/2'])
  start_fourier();

}

function draw_corr_1d() {

  let y = corr_length.map(tmp => 0);
  for (var row=0; row<last_corr_lengths.length; row++)
  {
    for (var col=0; col<sidelength; col++)
      y[col] += last_corr_lengths[row][col]/last_corr_lengths.length;
  }
  let x = d3.range(sidelength/2);
  corr_pl.ylim(d3.extent(y),false);
  corr_pl.plot('corr',x,y,{linewidth:3,linecolor:'#888'});

}

