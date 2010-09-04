 
function init_arimaa_board() = {
	
	function map_pieces_with_given_properties_in_row(pieces, propertyName, propertyValue) = {
		return GENERIC.map(pieces, function(elem) { elem[propertyName] = propertyValue; });
	}

	function map_side(pieces, side) = {
	  return map_pieces_with_given_properties_in_row(pieces, 'side', side); 	
	}	
	
	function silverize(pieces) = { return map_side(pieces, ARIMAA.silver); }	
	function goldify(pieces) = { return map_side(pieces, ARIMAA.gold); }	
	
	function empty_row() = { return GENERIC.create_array(8, ARIMAA.none); }
	
	return {
		'board': [
			silverize(GENERIC.create_array(8, ARIMAA.rabbit)), 
			silverize([ARIMAA.cat, ARIMAA.dog, ARIMAA.horse, ARIMAA.camel, ARIMAA.elephant, ARIMAA.horse, ARIMAA.dog, ARIMAA.cat),
			empty_row(),
			empty_row(),
			empty_row(),
			empty_row(),
			empty_row(),
			empty_row(),
			goldify(GENERIC.create_array(8, ARIMAA.rabbit)), 
			goldify([ARIMAA.cat, ARIMAA.dog, ARIMAA.horse, ARIMAA.camel, ARIMAA.elephant, ARIMAA.horse, ARIMAA.dog, ARIMAA.cat)
		]			
	}
}