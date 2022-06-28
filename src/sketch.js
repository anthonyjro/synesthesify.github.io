import { gradients } from './gradients.js'  
/* 
* Object containing arrays of gradients expressed  
* as hexadecimal colors */

// * Main function for the p5 component of the app

export function sketch(p){

  let scale = 40.0; // Sets current scale for the visual being rendered
  let fillcolor = 'black';
  let gradient = gradients['tangerine']; // Current gradient selected
  let current_shape = 'star'; // Current shape for the visual
  let curr = 0; // Variable for iterating through gradient list 
  let factor = 0.2; // Speed at which shape increases/decreses size
  let maxscale = 10.0; // Maximum size for shape
  let minscale = 0.0; // Minimum ""

  /* Function that creates the canvas and sets animation to loop */
  p.setup = () => {
      p.createCanvas(800, 800);
      p.loop();
    }
  
  /* Updates values with props fed in by main app */
  p.updateWithProps = props => {
    if(props.gradient_flavor){
      gradient = gradients[props.gradient_flavor];
    }

    if(props.shape){
      current_shape = props.shape;
    }

    if(props.factor && props.scale){
      factor =  (props.factor / (60.0) * 0.25);
      scale = (-10.0) * props.scale;
    }
  };
    
  p.draw = () => {
    if(scale > maxscale){ // Shrink
      scale = maxscale;
      factor *= -1;
    } else if(scale < minscale){ // Grow
      scale = minscale;
      factor *= -1;
    }
      switch(current_shape){
        case 'star':
          p.renderStar(15*scale, 35*scale, fillcolor);
          break;
        case 'circle':
          p.renderCircle(35*scale, 35*scale, fillcolor);
          break;
        default:
          break;
      }
      
      scale += factor;
      curr = (curr + 1) % gradient.length;
    }
  
  p.renderStar = (r1, r2, fc) => {
    p.push();
    p.translate(p.width * 0.5, p.height * 0.5);
    p.rotate(p.frameCount / -100.0);
    p.stroke(gradient[curr]);
    p.strokeWeight(4);
    p.fill(fc);
    p.star(0, 0, r1, r2, 5);
    p.pop();
  }

  p.renderCircle = (w, h, fc) => {
    p.push();
    p.translate(p.width * 0.5, p.height * 0.5);
    p.rotate(p.frameCount / -100.0);
    p.stroke(gradient[curr]);
    p.strokeWeight(4);
    p.fill(fc);
    p.ellipse(0,0, w, h)
    p.pop();
  }

  p.star = (x, y, radius1, radius2, npoints) => {
    let angle = p.TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    p.beginShape();
    for (let a = 0; a < p.TWO_PI; a += angle) {
      let sx = x + p.cos(a) * radius2;
      let sy = y + p.sin(a) * radius2;
      p.vertex(sx, sy);
      sx = x + p.cos(a + halfAngle) * radius1;
      sy = y + p.sin(a + halfAngle) * radius1;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }
  //p.redraw = () => {}
}


