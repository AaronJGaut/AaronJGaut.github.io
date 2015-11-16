
/* Javascript object that parses the Google form and generates a students 
 * object with all the necessary information. For now it just generates a
 * students object with randomized preferences if you call the randomize
 * method. -Aaron */

 
 
 
function parser(){
	var students = new Array();
	var parsed = false;
	
	this.parsecsv = function(csv){
/*Sample parsecsv2 input (Try pasting in the csv String field):
Triangles,Squares,Circles
Alice,2,1,3
Bob,2,3,1
Curly,2,1,3
Dave,1,3,2
Eric,2,1,3
Flower,3,2,1
Gloria,3,2,1
Hugo,3,2,1
*/
	
	
		var rows = csv.split("\n");
		students.size = rows.length-1;
		var entries = new Array();
		
		for (var i = 0; i < rows.length; i++)
			entries[i] = rows[i].split(",");
		students.groups = entries[0].length;
		
		students.groupSize = Math.ceil(students.size/students.groups);
		
		students.groupNames = new Array();
		for (var i = 0; i < students.groups; i++)
			students.groupNames[i] = entries[0][i];
		
		for (var i = 0; i < students.size; i++){
			students[i] = new Array();
			students[i].name = entries[i+1][0];
			var temp = new Array();
			for (var j = 0; j < students.groups; j++){
				temp[j] = parseInt(entries[i+1][j+1]);
			}
			for (var j = 0; j < temp.length; j++)
				students[i][j] = 0;
			for (var j = 0; j < temp.length; j++){
				var min = -1;
				for (var k = 0; k < temp.length; k++)
					if (students[i][k] == 0 && (min == -1 || temp[k] < temp[min]))
						min = k;
				students[i][min] = j+1;
			}
		}
		parsed = true;	
	};
	
	
	
	this.parsecsv2 = function(csv){
	
	// Parses the csv text and creates a students object ready to be used
	// by solver. Strictly assumes the first question asks for name, and
	// the rest of the questions ask for group preferences.
	
/*Sample parsecsv2 input (Try pasting in the csv String field):
"TimeStamp","Trianges","Squares","Circles"
"Time1","Alice","2","1","3"
"Time2","Bob","2","3","1"
"Time3","Curly","2","1","1"
"Time4","Dave","1","3","2"
"Time5","Eric","2","1","3"
"Time6","Flower","3","2","1"
"Time7","Gloria","3","2","1"
"Time8","Hugo","3","2","1"
*/


		var csv2 = csv.substring(1,csv.length-1);
		var rows = csv2.split("\"\n\"");
		students.size = rows.length-1;
		
		var entries = new Array();
		
		for (var i = 0; i < rows.length; i++)
			entries[i] = rows[i].split("\",\"");
		
		students.groups = entries[0].length-2;
		students.groupSize = Math.ceil(students.size/students.groups);
		for (var i = 0; i < students.size; i++){
			students[i] = new Array();
			students[i].name = entries[i+1][1];
			var temp = new Array();
			for (var j = 0; j < students.groups; j++){
				temp[j] = parseInt(entries[i+1][j+2]);
			}
			for (var j = 0; j < temp.length; j++)
				students[i][j] = 0;
			for (var j = 0; j < temp.length; j++){
				var min = -1;
				for (var k = 0; k < temp.length; k++)
					if (students[i][k] == 0 && (min == -1 || temp[k] < temp[min]))
						min = k;
				students[i][min] = j+1;
			}
		}
		parsed = true;
	};
	
	this.randomize = function(a, b){
	// Randomizes a students object 
		var randStudents = parseInt(a);
		var randGroups = parseInt(b);
		var randGroupSize = Math.ceil(a/b);
		
		students.groupNames = new Array();
		for (var i = 0; i < randGroups; i++){
			students.groupNames[i] = "Group " + i;
		}
		
		for (var i = 0; i < randStudents; i++){
			students[i] = new Array();
			students[i].name = "John Doe " + i;
			var temp = new Array();
			temp.size = randGroups;
			for (var k = 0; k < randGroups; k++) {
				temp[k] = k+1;
			}
			
			for (var j = 0; j < randGroups; j++) {
				temp.select = Math.round(Math.random()*temp.size - 0.5);
				students[i][j] = temp[temp.select];
				temp.size--;
				temp[temp.select] = temp[temp.size];
			}	
			
		}
		students.groupSize = randGroupSize;
		students.groups = randGroups;
		students.size = randStudents;
		
		parsed = true;
		
	};
	
	this.getStudents = function(){
		if (parsed) { return students;
		} else { return null; }
	};
}


/* An implementation of the Hungarian method using a javascript object -Aaron*/

function solver(students){
	var students = students;
	var size = students.groups*students.groupSize;
	
	var costMatrix = new Array();
	
	var markedRows = new Array();
	var markedCols = new Array();
	
	var zpath = new Array();
	zpath.size = 0;
	
	function coord(i, j){
		this.row = i;
		this.col = j;
	};
	
	function entry(n){
		this.cost = n;
		this.star = false;
		this.prime = false;
	}
	
	this.getStudents = function(){ return students; };
	
	var generateArray = function(){
	
		for (var i = 0; i < students.size; i++){
			costMatrix[i] = new Array();
			for (var j = 0; j < students.groups; j++)
				for (var k = 0; k < students.groupSize; k++)
					costMatrix[i][j*students.groupSize+k] = new entry(students[i][j]);
		}
		
		for (var i = students.size; i < size; i++){
			costMatrix[i] = new Array();
			for (var j = 0; j < size; j++)
				costMatrix[i][j] = new entry(0);
		}
				
		for (var i = 0; i < size; i++){
			markedRows[i] = false;
			markedCols[i] = false;
		}
	};
	
	var process = function(){
	
		var step = 1;
		while (step < 7){
			//alert(step);
			switch(step)
			{
				case 1: step = step1(); break;
				case 2: step = step2(); break;
				case 3: step = step3(); break;
				case 4: step = step4(); break;
				case 5: step = step5(); break;
				case 6: step = step6(); break;
			}
		}
	};
	
	var clearMarks = function(){
		for (var k = 0; k < size; k++){
			markedRows[k] = false;
			markedCols[k] = false;
		}
	
	};
	
	var clearStars = function(){
		for (var i = 0; i < size; i++){
			for (var j = 0; j < size; j++){
				costMatrix[i][j].star = false;
			}
		}
	};
	
	var clearPrimes = function(){
		for (var i = 0; i < size; i++){
			for (var j = 0; j < size; j++){
				costMatrix[i][j].prime = false;
			}
		}
	};
	
	var step1 = function(){
	/* Performs initial simplifications: subtracts smallest number
	 * present in each row from each entry in the corresponding row,
	 * then does the same by columns. 
	 *************************************************************************/
		for (var i = 0; i < size; i++) {
			var min = costMatrix[i][0].cost;
			for (var j = 1; j < size; j++)
				if (costMatrix[i][j].cost < min) min = costMatrix[i][j].cost ;
			for (var j = 0; j < size; j++)
				costMatrix[i][j].cost -= min;
		}
		for (var j = 0; j < size; j++) {
			var min = costMatrix[0][j].cost;
			for (var i = 1; i < size; i++)
				if (costMatrix[i][j].cost < min) min = costMatrix[i][j].cost;
			for (var i = 0; i < size; i++)
				costMatrix[i][j].cost -= min;
		}
		return 2;
	};
	
	var step2 = function(){
	/* Greedily selects zeroes in unique rows and columns, stars them, 
	 * and marks the columns of the starred zeroes. Proceeds to step 3
	 *************************************************************************/
		for (var i = 0; i < size; i++){
			for (var j = 0; j < size; j++){
				if (!markedCols[j] && costMatrix[i][j].cost == 0){
					markedCols[j] = true;
					costMatrix[i][j].star = true;
					break;
				}
			}
		}
		return 3;
	};
	
	var step3 = function(){
	/* Looks for a zero which is not marked. If success, primes the zero,
	 * and checks if the zero is in the same row as a star. If so, unmarks the 
	 * column of the star and marks the row of the prime and repeats step 3. Else, 
	 * sets the first coord in zpath to be the coord of the primed zero and goto step 4.
	 * If failure, proceeds to step 5. 
	 *************************************************************************/
		for (var i = 0; i < size; i++)
			for (var j = 0; j < size; j++)
				if (costMatrix[i][j].cost == 0 && !(markedRows[i] || markedCols[j])){
					costMatrix[i][j].prime = true;
					
					for (var k = 0; k < size; k++)
						if (costMatrix[i][k].star == true){
							markedCols[k] = false;
							markedRows[i] = true;
							return 3;
						}
					
					zpath.size = 1;
					zpath[0] = new coord(i, j);
					//alert(i + ", " + j);
					return 4;
				}
		clearPrimes();
		return 5;
	};
	
	var step4 = function(){
	/* Creates zpath, an alternating list of coords of primes and stars 
	 * sharing the same row or column. There should always end up with one 
	 * more prime than star in zpath. Removes stars in zpath and turns primes
	 * into stars. Changes marked rows and columns to only mark the columns
	 * of stars, deletes all primes, clears zpath, then returns to step 3.
	 *************************************************************************/
		var done = false;
		while (!done){
			done = true;
			for (var i = 0; i < size; i++)
				if (costMatrix[i][zpath[zpath.size-1].col].star){
					zpath[zpath.size] = new coord(i, zpath[zpath.size-1].col);
					//alert(zpath[zpath.size].row + ", " + zpath[zpath.size].col);
					zpath.size++;
					done = false;
					break;
				}
			
			if (!done)
				for (var j = 0; j < size; j++)
					if (costMatrix[zpath[zpath.size-1].row][j].prime){
						zpath[zpath.size] = new coord(zpath[zpath.size-1].row, j);
						//alert(zpath[zpath.size].row + ", " + zpath[zpath.size].col);
						zpath.size++;
						break;
					}
		}
		
		for (var k = 0; k < zpath.size; k += 2)
			costMatrix[zpath[k].row][zpath[k].col].star = true;
		for (var k = 1; k < zpath.size; k += 2)
			costMatrix[zpath[k].row][zpath[k].col].star = false;
			
		zpath.size = 0;
		clearMarks();
		clearPrimes();
		
		for (var i = 0; i < size; i++)
			for (var j = 0; j < size; j++)
				if (costMatrix[i][j].star){
					markedCols[j] = true;
					break;
				}
			
		return 3;
	};
	
	var step5 = function(){
	/* Checks if marked rows and cols are less than size. If so, clear stars
	 * and go to step 6. Else, create a list of unique pairings from starred
	 * zeroes, clear stars and marks, and return 7 to exit. 
	 *************************************************************************/
		var marks = 0;
		for (var k = 0; k < size; k++) {
			if (markedRows[k]) marks++;
			if (markedCols[k]) marks++;
		}
		
		if (marks < size){
			clearStars();
			return 6;
		} else if (marks == size){
			for (var i = 0; i < students.size; i++)
				for (var j = 0; j < size; j++){
					if (costMatrix[i][j].star){
						students[i].group = Math.floor(j/students.groupSize);
						break;	
					}
				}
			clearStars();
			clearMarks();
			return 7;
		} else {
			alert("Unexpected error in step5");
		}
	};
	
	var step6 = function(){
	/* Finds the smallest cost that isn't marked by row or column,
	 * then adds this value to all entries that are marked both directions
	 * and subtracts it from all entries that are not marked. Then starts
	 * over from step 2. 
	 *************************************************************************/
		var min = -1;
		for (var i = 0; i < size; i++)
			for (var j = 0; j < size; j++)
				if ((costMatrix[i][j].cost < min || min == -1) && !(markedRows[i] || markedCols[j]))
					min = costMatrix[i][j].cost;
	
		if (min != -1) {
			for (var i = 0; i < size; i++)
				for (var j = 0; j < size; j++)
					if (markedRows[i] && markedCols[j]) {
						costMatrix[i][j].cost += min;
					} else if (!(markedRows[i] || markedCols[j])) {
						costMatrix[i][j].cost -= min;
					}
		} else {
			alert("Unexpected error in step6");
		}
		clearMarks();
		return 2;
	};	
	
	generateArray();
	process();

}