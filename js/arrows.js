function create_arrow_handler(gametree, viewer) {
	function coordinates_from_arrow(arrow) {
		return {
			'row': parseInt(arrow.attr('row')),
			'col': parseInt(arrow.attr('col'))
		}
	}
	
	function clear_arrows() {	$('.arrow').hide();	}
	
	function show_arrows(elem) {
		$('.arrow').hide();
		
		var coordinate = {
		 'row': row_index(elem),
		 'col': col_index(elem)
		}
		
		var possible_moves = ARIMAA.legal_moves(viewer.gamestate(), viewer.board(), coordinate);

		GENERIC.for_each(possible_moves, function(move) {
				var x_change = move.col - coordinate.col;
				var y_change = move.row - coordinate.row;
				var piece_center = {
					'x': elem.position().left + elem.width() / 2,
					'y': elem.position().top + elem.height() / 2
				}
				show_arrow_for_move(coordinate, piece_center, x_change, y_change);
		});
	}		

	function get_arrow_elem(x_change, y_change) {
		return x_change < 0 ? "left" : x_change > 0 ? "right" : y_change < 0 ? "up" : "down"; 
	}
	
	function show_arrow_for_move(coordinate, piece_center, x_change, y_change) {
		var center_x = piece_center.x - $('.arrow').width() / 2;
    var center_y = piece_center.y - $('.arrow').height() / 2;

    var arrow_dir = get_arrow_elem(x_change, y_change);
    
    var arrow_elem = $('#arrow' + "_" + arrow_dir);
    
    arrow_elem
      .attr('row', coordinate.row + y_change)
      .attr('col', coordinate.col + x_change)
      .css('left', center_x + (x_change !== 0 ? x_change * arrow_elem.width() * 0.9 : 0))
      .css('top', center_y + (y_change !== 0 ? y_change * arrow_elem.height() * 0.9: 0))
      .show();
	}
	
	return {
		'coordinates_from_arrow': coordinates_from_arrow,
		clear_arrows: clear_arrows,
		show_arrows: show_arrows,
		show_arrow_for_move: show_arrow_for_move
	}
	
}

$(function() {
	$('.arrownormal').mouseenter(function() {
		$(this).hide();
		$(this).closest('.arrow').find('.arrowhover').show();		
	});
	
	$('.arrowhover').mouseleave(function() {
		$(this).hide();
		$(this).closest('.arrow').find('.arrownormal').show();		
	});		
});
