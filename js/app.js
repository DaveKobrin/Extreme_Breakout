console.log("sanity check");
canvas = document.querySelector('#viewport')
context = canvas.getContext('2d');

context.fillstyle = 'rgb(0,0,0)';
context.fillRect(0,0,canvas.width,canvas.height);