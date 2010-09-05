
function generate_moves(moves) {
	
	var imported = create_import_game(moves);
	
	var result = [];
	do {
		var move = imported.get_steps_in_next_move();
		result.push(move);
	} while(move.length !== 0);
	
	//result.pop(); shall we leave the empty move?
	
	return result;
}

function create_import_game(moves) {
	var currentmove = 0;
	var currentstep = 0;
	
	function get_next_step() {
		if(currentmove >= moves.length || currentstep >= moves[currentmove].steps.length) {
			return false;
		} else {
			var nextstep = moves[currentmove].steps[currentstep];

			currentstep++;
			
			if(currentstep >= moves[currentmove].steps.length) {
				currentstep = 0;
				currentmove++;
			}
			
			var step = TRANSLATOR.convert_notated_step_to_coordinates(nextstep);
			
			// if step is only indicating a removal, let's skip it since it is done by the game logic
			if(step.type === 'removal') return get_next_step();
			else return step;
		}
	}
	
	function get_steps_in_next_move() {
		var result = [];

		var current = currentmove;

		do {
			var step = get_next_step();
			if(!step) return result;
			result.push(step);
		} while(current === currentmove) // get_next_step updates currentmove
		
		return result;
	}
	
	return {
		'get_next_step': get_next_step,
		'get_steps_in_next_move': get_steps_in_next_move,
	}
}
