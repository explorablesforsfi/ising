# Ising Model

This is a small web app to demonstrate magnetization
at finite temperature using the Ising model and Glauber's
dynamics and to explore the associated phase transition.

## Run

First, clone this repository

    git clone https://github.com/explorablesforsfi/ising.git

Then change to the created directory and start a local webserver

    cd ising
    python -m "http.server" 1313
    
Go to your browser and navigate to http://localhost:1313 .

![ising model](https://github.com/explorablesforsfi/ising/raw/master/img/example.png)

## License

All original code in this repository, i.e. all code which is not in the subdirectory `/libs/` is licensed under the CC 4.0 licence. The subdirectory `/libs/` contains external libraries which are licensed as follows

 
| File name                      | License                                 | Link to repository|
|--------------------------------|-----------------------------------------|-------------------|
| `d3-color.v1.min.js`           | BSD 3-Clause "New" or "Revised" License | [d3-color](https://github.com/d3/d3-color)|
| `d3-scale-chromatic.v1.min.js` | BSD 3-Clause "New" or "Revised" License | [d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic)|
| `d3.v4.min.js`                 | BSD 3-Clause "New" or "Revised" License | [d3](https://github.com/d3/d3)|
| `fourier.js`                   | MIT                                     | [JS-Fourier-Image-Analysis](https://github.com/turbomaze/JS-Fourier-Image-Analysis)|
| `simple_plot.js`               | CC 4.0                                  | [simple-plot](https://github.com/benmaier/simple-plot)|
| `widget.v3.4.js`               | permission to use given by D. Brockmann | [complexity explorables](http://www.complexity-explorables.org) |
