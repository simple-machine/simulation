var wheel_angle = 0;
var timer = 0;
var cycleTimer = 0;
var cycle = 0;
var motorPower = 0;
var frameTime = 50; //ms
var throughput = 0;
var previousStroke = 0;
var patientHeight = 0;
var currentCycleTime = 0;
	
$(document).ready(function() {
    
	$('#run').change(function() {
		timer = 0;
		cycleTimer = 0;
		cycle = 0;
		wheel_angle = 0;
		throughput = 0;
		previousStroke = 0;
		patientHeight = 0;
		currentCycleTime = 0;
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
	var stroke = radius - radius * Math.cos( wheel_angle * Math.PI / 180 );
	
	var displacement = area * stroke;
	
	var rate = $("#rate").val();
	var patientArea = $("#patient-area").val();
	var throat = parseFloat( $("#throat").val());
	var exhaleToInhale = parseFloat( $("#exin").val());

	var cycleTime = 60000 / rate; // ms
	
	var inhalationTime = cycleTime / ( 1 + exhaleToInhale );
	var exhalationTime = cycleTime - inhalationTime;
	var inhaleVolumePerFrame = tidalVolume / (inhalationTime / frameTime);

	if (currentCycleTime > cycleTime) currentCycleTime = 0;
	
	if (true && currentCycleTime < inhalationTime) {
		// inhale
		// move wheel enough to flow inhaleVolumePerFrame
		$(".wheel-holder").css({'background-color': 'lightgreen'});
		var targetStroke = stroke + (inhaleVolumePerFrame / area);
		var targetAngle = Math.acos( (radius - targetStroke) / radius ) * 180/Math.PI;

		setMotorPower( Math.abs(Math.round(targetAngle - wheel_angle)) );
		//console.log("target stroke: " +targetStroke + "target angle: "+ targetAngle + "diff " + (wheel_angle - targetAngle));		
	}
	else if (currentCycleTime < (inhalationTime + exhalationTime)) {
		// exhale - return to tdc before exhalationTime runs out
		$(".wheel-holder").css({'background-color': 'pink'});
		if ( wheel_angle > 180  ) { 
			setMotorPower(1);
		}
		else if ( wheel_angle > 2 && wheel_angle < 180 ) {
			setMotorPower(-5);
		}
		else {
			setMotorPower(0);
		}
		
	}
	currentCycleTime += frameTime;
	
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

	
	setWheelAngle(wheel_angle);
	
	setManometerHeight('ip', patientHeight);
	
	// TODO calculate differential pressure created by flow across orifice
	setManometerHeight('flow', flow/3);	
	
	// TODO simulate O2 flowrate adjustment (turning knobs)
	setManometerHeight('o2', 5);	

	if ($('#run').is(":checked") == true) {
		setTimeout(function() {run();}, frameTime);
	}
	
	if ($('#run-host').is(":checked") == true) {
		setTimeout(function() {run();}, frameTime);
	}
}

// ms timer
function runTimer() {
	timer += 1;
	if (document.getElementById('run').checked == 1) {
		setTimeout(function() {runTimer();}, 1);
	}
}

function setMotorPower(power) {
	if (power > 0 && power > 10) power = 10;
	if (power < 0 && power < -10) power = -10;
	motorPower = power;
	$("#motor-power").val(motorPower);
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
