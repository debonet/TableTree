# TableTree

A collapsible, sortable, scrollable table according to a table
definition, using the data from a tree


## Usage

~~~javascript
fTableTree(jqParent, tabledef, vaNode)
~~~

Where


~~~
	 fTableTree
	   renders a collapsible, sortable, scrollable table according to a table
	   definition, using the data from a tree
	
	 Params:
	   jqParent := elements into which the table should be rendered
	
	   tabledef := configuration:
	      collapsed  := optional. default collapsed state for each row if 
	                    not specified (default: false)
	
	      onChange   := `function()` called when table first drawn or redrawn
	                    due to sort or collapse changes
	
	      class      := classes to add to the table
	
	      scrollable := if true, the body can be scrolled indepdently of the
	                    header
	
	      indentSize := pixels to indent a cell for each level of the tree
	
	      header     := a vector of cell definitions see [columns]
	
	      columns    := a vector of cell definitions see [columns]
	        column settings:
	          required:
	            value      := field name or `function(aNode)` to return 
	                          value for content
	          optional:
	            indent     := this column should be indented indentSize * depth
	                          (default: false)
	 
	            class      := classes to add to the column
	
	            colspan    := number or `function(aNode)` number of 
	                          columns this column should subtend 
	                          (default 1)
	
	            rowspan    := number or `function(aNode)` number of 
	                          columns this column should subtend
	                          (default 1)
	
	            format     := `function(x,aNode)` return content 
	                          from value (defaults to identity)
	
	            heading    := content to put in the column header
	
	            unsortable := if true, sorting not allowed on this column. 
	                          (default: false, sorting allowed)
	
	            sort       := {"up", "down"} sort direction
	
	            sortvalue  := field or function used for sorting 
	                          (defaults to the column value setting)
	
	            comparator := function used to compare the  sorting value 
	                          (default: numeric sorting)
	
	            alter     := `function(jqCell, aNode, nRow, nCol, cDepth)` a
	                          function called after each cell is generated to
	                          allow for arbitrary modifications of the cell
	
	      rows       := row definitions
	          optional:
	            class      := string or `function(aNode)` class to
	                          add to each row
	
	            alter      := `function(jqRow, aNode, nRow, cDepth)` a function
	                          called after each row is generated to allow for
	                          arbitrary modifications of the row
	
	   vaNode := tree of arbitrary data stored as an array of sibling nodes
	      node structure:
	         an object that can contain aribitrary data, referencable by the
	         column value specification. A tree node also has the following
	         special fields:
	
	         children      := a subtree    
	
	         collapsed     := boolean. current collapse state
	           meaning:
	              true  := in collapsed state, can be expanded
	              false := in expanded state, can be collapsed
	
	         uncollapsible := optional. If true, and has children, then node
	                          can be collapsed
	 
~~~



## License

The MIT License (MIT)

Copyright (c) 2013 Jeremy S. De Bonet

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

