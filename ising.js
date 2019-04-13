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

 
let T = 2.0,               // occupation probability 
    sidelength = 128;           // how many sites per side of the square

let N = sidelength*sidelength; // total number of sites
let n_clusters = 0;            // current number of clusters
let color = d3.scaleOrdinal(d3.schemeDark2); // colorscheme

var width = sidelength*pixel_width,   // canvas width
    height = sidelength*pixel_width;  // canvas height
var plot_width = 250, plot_height=250;
var canvas = d3.select('#percolation_container')
               .append('canvas')
               .attr('width', width)
               .attr('height', height);

var ctx = canvas.node().getContext('2d');
var transform = d3.zoomIdentity;

retina(canvas,ctx,width,height);

// ============== ising functions ===============

function initialize_ising_canvas() {
    // get the first two colors in order to fix them
    let a = color(0);
    let b = color(1);
    canvas
        //.call(d3.drag().subject(dragsubject).on("drag", dragged))
        .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed))
        .call(draw);
}

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
  plottime = d3.interval(function(elapsed) {
    analyze_magnetization();
    plot_magnetization();
  },100);
}

function stop_ising()
{
  maintimer.stop();
  plotttimer.stop();
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
        ctx.fillStyle = color((sites[index(x,y)]+1)/2);
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
      ctx.fillStyle = color((site.s+1)/2);
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
    let p = 0.8;

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

// ================= plot functions ===========
//
//
var magnetization_canvas = d3.select('#magnetization_container')
  .append('canvas')
  .attr('width', plot_width)
  .attr('height', plot_height);

var m_ctx = magnetization_canvas.node().getContext('2d');
retina(magnetization_canvas,m_ctx,plot_width,plot_height);
var m_pl = new simplePlot(m_ctx,plot_width,plot_height,{margin:30,fontsize:16});
m_pl.xlabel('temperature');
m_pl.ylabel('magnetization');
m_pl.xlimlabels(['0','5']);
m_pl.ylimlabels(['-1','+1']);
m_pl.xlim([0,5]);
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
    m_pl.scatter('systemmarker',[T],[M],{marker:'o',markercolor:'rgba(255,255,255,1.0)', markerradius:10,markeredgewidth:1,markeredgecolor:'rgba(102,102,102,1.0)'});
    m_pl.scatter('plus',m_x_plus,m_y_plus,{marker:'s',markercolor:'rgba(217,95,2,0.3)',markerradius:2});
    m_pl.scatter('minus',m_x_minus,m_y_minus,{marker:'s',markercolor:'rgba(27,158,119,0.3)',markerradius:2});
}
