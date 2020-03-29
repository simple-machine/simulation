var wheel_angle = 0;
var timer = 0;
var cycleTimer = 0;
var cycle = 0;
var motorPower = 0;
var frameRate = 20; //ms
var throughput = 0;
var previousStroke = 0;
var patientHeight = 0;
	
$(document).ready(function() {
    
	$('#run').change(function() {
		timer = 0;
		cycleTimer = 0;
		cycle = 0;
		wheel_angle = 0;
		throughput = 0;
		previousStroke = 0;
		patientHeight = 0;
		run();
		//runTimer();
	});

	$('#motor-power').change(function() {
		motorPower = parseInt($('#motor-power').val());
	});
	$('.power-up').click(function() {
		motorPower++;
		$('#motor-power').val(motorPower);
	});
	$('.power-down').click(function() {
		motorPower--;
		$('#motor-power').val(motorPower);
	});

	
});


function run() {
	//console.log(motorPower);
	wheel_angle += motorPower;
	if(wheel_angle >= 360 ) wheel_angle = wheel_angle - 360; // restrict to 0 < angle < 360
	if(wheel_angle < 0 ) wheel_angle = wheel_angle + 360;
	
	var area = Math.pow($("#bore").val()/2, 2) * Math.PI;
	var radius = $("#radius").val();
	var fullStroke = radius * 2;
	var fullStrokeDisplacement = area * fullStroke;
	
	var tidalVolume = $("#tidalVolume").val();

	var tidalStroke = tidalVolume / area;
	var tidalAngle;
	var stroke = radius -  radius * Math.cos( wheel_angle * Math.PI / 180 );
	
	var displacement = area * stroke;
	
	var patientArea = $("#patient-area").val();
	var throat = parseFloat( $("#throat").val());
	
	var flow = 0;
	// accumulate positive displacement to calculate throughput
	if (stroke - previousStroke > 0) {
		flow = displacement - area * previousStroke;
		throughput += flow;
	}
	previousStroke = stroke;
	
	if (flow > 0) {
		// flow has gone into patient column
		patientHeight += flow / area;
	}
	else {
		// exhaling
		var expiration = 10 * Math.sqrt(patientHeight) * Math.pow(throat, 2); // TODO replace with real calc
		patientHeight -= expiration / area;
		if (patientHeight < 0) patientHeight = 0;
	}
	// angle required to reach tidal volume
	if (tidalVolume >= fullStrokeDisplacement) {
		tidalAngle = 180; // Avoid division by zero
	}
	else {
		tidalAngle = Math.acos( (radius - tidalStroke) / radius ) * 180/Math.PI;
	}
	
	$(".fs").text(fullStroke);

	$(".fsd").text(Math.round( fullStrokeDisplacement ));

	$(".stroke").text( Math.round(stroke) );

	$(".displacement").text(Math.round( displacement ) );

	$(".throughput").text(Math.round( throughput * 10) / 10000);


	$(".ta").text(  Math.round( tidalAngle ) );

/*
	if (wheel_angle >= tidalAngle ) {
		cycle = 1;
		motorPower = - motorPower;
	}
	else if ( wheel_angle <= 0 ) {
		cycle = 0;
		//console.log(timer);
		motorPower = - motorPower;
	}
*/

	setWheelAngle(wheel_angle);
	
	setManometerHeight('ip', patientHeight);
	
	// TODO calculate differential pressure created by flow across orifice
	setManometerHeight('flow', flow);	
	
	// TODO simulate O2 flowrate adjustment (turning knobs)
	setManometerHeight('o2', 5);	

	if ($('#run').is(":checked") == true) {
		setTimeout(function() {run();}, frameRate);
	}
	
	if ($('#run-host').is(":checked") == true) {
		setTimeout(function() {run();}, frameRate);
	}
}

// ms timer
function runTimer() {
	timer += 1;
	if (document.getElementById('run').checked == 1) {
		setTimeout(function() {runTimer();}, 1);
	}
}

function setWheelAngle(angle) {
	$('#wheel').css({ WebkitTransform: 'rotate('+angle+'deg)'});
	$(".wheel-holder .value").text(angle);	
	$("#cv-rotation").val(angle);	
}

function setManometerHeight(selector, height) {
	$('#' + selector + ' .left').css({ height: 100+height });		
	$('#' + selector + ' .right').css({ height: 100-height});	
	$('#' + selector + ' .value').text(Math.round(height));	
	$("#cv-"+selector).val(Math.round(height, 3));	
}
