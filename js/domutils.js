  function turn_prefix(turn) { return turn.side.slice(0, 1); }
	
	function singleton_after_opposite(turn) {
		return turn_prefix(ARIMAA.opposite_turn(turn)) + "singletonafter";
	}
	
	function singleton_before_opposite(turn) {
		return turn_prefix(ARIMAA.opposite_turn(turn)) + "singletonbefore";
	}
