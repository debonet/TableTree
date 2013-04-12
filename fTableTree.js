var fTableTree = (function (){

	//------------------------------------------------------------------------
	// fTableTree
	//   renders a collapsible, sortable, scrollable table according to a table
	//   definition, using the data from a tree
	//
	// Params:
	//   jqParent := elements into which the table should be rendered
	//
	//   tabledef := configuration:
  //      collapsed  := optional. default collapsed state for each row if 
	//                    not specified (default: false)
	//
	//      onChange   := `function()` called when table first drawn or redrawn
	//                    due to sort or collapse changes
	//
	//      class      := classes to add to the table
	//
	//      scrollable := if true, the body can be scrolled indepdently of the
	//                    header
	//
	//      indentSize := pixels to indent a cell for each level of the tree
	//
	//      header     := a vector of cell definitions see [columns]
	//
	//      columns    := a vector of cell definitions see [columns]
	//        column settings:
	//          required:
	//            value      := field name or `function(aNode)` to return 
	//                          value for content
	//          optional:
	//            indent     := this column should be indented indentSize * depth
	//                          (default: false)
	// 
	//            class      := classes to add to the column
	//
	//            colspan    := number or `function(aNode)` number of 
	//                          columns this column should subtend 
	//                          (default 1)
	//
	//            rowspan    := number or `function(aNode)` number of 
	//                          columns this column should subtend
	//                          (default 1)
	//
	//            format     := `function(x,aNode)` return content 
	//                          from value (defaults to identity)
	//
	//            heading    := content to put in the column header
	//
	//            unsortable := if true, sorting not allowed on this column. 
	//                          (default: false, sorting allowed)
	//
	//            sort       := {"up", "down"} sort direction
	//
	//            sortvalue  := field or function used for sorting 
	//                          (defaults to the column value setting)
	//
	//            comparator := function used to compare the  sorting value 
	//                          (default: numeric sorting)
	//
	//            alter     := `function(jqCell, aNode, nRow, nCol, cDepth)` a
	//                          function called after each cell is generated to
	//                          allow for arbitrary modifications of the cell
	//
	//      rows       := row definitions
	//          optional:
	//            class      := string or `function(aNode)` class to
	//                          add to each row
	//
	//            alter      := `function(jqRow, aNode, nRow, cDepth)` a function
	//                          called after each row is generated to allow for
	//                          arbitrary modifications of the row
  //
	//   vaNode := tree of arbitrary data stored as an array of sibling nodes
	//      node structure:
	//         an object that can contain aribitrary data, referencable by the
	//         column value specification. A tree node also has the following
	//         special fields:
	//
	//         children      := a subtree    
	//
	//         collapsed     := boolean. current collapse state
	//           meaning:
	//              true  := in collapsed state, can be expanded
	//              false := in expanded state, can be collapsed
	//
	//         uncollapsible := optional. If true, and has children, then node
	//                          can be collapsed
	// 
	var fTableTree = function (jqParent,tabledef,vaNode){

		vaNode = vaNode || [];

		tabledef = {
			scrolled   : true,
			indentSize : 20,
			header     : [],
			columns    : [],
			rows       : {
			"class"    : ""
			}
		}.mergeIn(tabledef);

		// force a boolean value for tabledef
		tabledef.collapsed = (tabledef.collapsed === true);
		fSetDefaultCollapsedState(vaNode, tabledef.collapsed);

		jqParent.children().remove();
		var jqTable = fjqTableFromTableDef(jqParent, tabledef, vaNode);

		fAddSortFunctionality(jqTable,tabledef,vaNode);
		fAddCollapseFunctionality(jqTable,tabledef,vaNode);

		if (tabledef.scrollable){
			fAddScrollFunctionality(jqTable,tabledef,vaNode);
		}
		if (tabledef.onChange){
			tabledef.onChange();
		}
	};



	// ------------------
	// fAddCellContent 
	//   Create the content for a cell located with a column and row with the
	//   specified properies 
	//
	// Params
	//   jqParent  := parent into which cell should be added
	//   jqContent := content
	//   aNode     := the node to show in this cell
	//   aColumn   := properties of the current column
	//   tabledef  := table definition
	//   cDepth    := tree depth of this cell
	//   
	// Scope => Private
	//
	var fAddCellContent = function(
		jqParent, jqContent, aNode, aColumn, tabledef, cDepth
	){
		var jqCell = fjqNew("div", jqParent).html(jqContent || "");

		if (aNode.collapsed === true){
			jqCell.addClass("collapsed");
		}
		if (aNode.collapsed === false){
			jqCell.addClass("expanded");
		}
				
		jqParent.addClass(aColumn["cellclass"]);
		jqParent.addClass(aNode["cellclass"]);
		jqCell.addClass(aColumn["class"]);
		jqCell.addClass(aNode["class"]);

		if (aColumn["indent"]){
			jqCell.css("padding-left",cDepth * tabledef["indentSize"]);
		}

		// add classes for sort direction
		// sorted-up|sorted-down|sorted-none and sortable|unsortable
		if (aColumn["unsortable"]){
			jqCell.addClass("unsortable");
		}
		else{
			jqCell.addClass("sortable");
			if (aColumn["sort"]){
				jqCell.addClass("sorted-" + aColumn["sort"]);
			}
			else{
				jqCell.addClass("sorted-none");
			}
		}


		// fxEvalOrGet
		//  if the argument is a function, evaluate it on the node 
		//  and return result otherwise return the argument
		var fxEvalOrGet = function(x,aNode){
			if (nsTypes.fbIsFunction(x)){
				return x(aNode);
			}
			return x;
		};

		if (aColumn["colspan"]){
			var cColSpan = fxEvalOrGet(aColumn["colspan"],aNode);
			jqParent.attr("colspan",cColSpan);
		}

		if (aColumn["rowspan"]){
			var cRowSpan = fxEvalOrGet(aColumn["rowspan"],aNode);
			jqParent.attr("rowspan",cRowSpan);
		}
	};


	//------------------------------------------------------------------------
	// fjqGetCellContent
	//   determines the content of the cell by applying the column 
	//   specification to the node
	//
	// Params
	//   xColumnSpecification := union of (s or f)
	//      jq  := name of the field in the node to use for the content
	//      fjq := `function(aNode)` which when applied returns the content
	//
	// Returns
	//  the content for that cell
	//
	// Scope => Private
	//
	var fjqGetCellContent = function (xColumnSpecification,aNode){
		if (nsTypes.fbIsFunction(xColumnSpecification)){
			return xColumnSpecification(aNode);
		}
		else{
			return aNode[xColumnSpecification];
		}
	};

	//------------------------------------------------------------------------
	// fAddRows
	//   recursively adds rows to table from given tree
	//
	// Params
	//   jqParent := destination for rows
	//   vaNode   := subtree of data to render
	//   tabledef := the table definition
	//   cDepth   := depth of subtree
	//   
	// Scope => Private
	//
	var fAddRows = function(jqParent, vaNode, tabledef, cDepth){
		vaNode.each(function(aNode,nRow){
			var jqRow = fjqNew("tr", jqParent);

			if (tabledef["rows"]["class"]){
				if (nsTypes.fbIsFunction(tabledef["rows"]["class"])){
					jqRow.addClass(tabledef["rows"]["class"](aNode));
				}
				else{
					jqRow.addClass(tabledef["rows"]["class"]);
				}
			}


			tabledef["columns"].each(function(aColumn,nCol){
				var jqContent = fjqGetCellContent(aColumn.value, aNode);

				if (nsTypes.fbIsFunction(aColumn.format)){
					jqContent = aColumn.format(jqContent, aNode);
				}

				if (!(aColumn["skippable"] && typeof(jqContent) === "undefined")){
					var jqCell = fjqNew("td",jqRow);
					fAddCellContent(jqCell,	jqContent, aNode, aColumn, tabledef, cDepth);

					if (aColumn["alter"]){
						aColumn["alter"](jqRow,aNode,nRow,nCol,cDepth);
					}
				}
			});

			if (aNode.children && !aNode.collapsed){
				fAddRows(jqParent, aNode.children,tabledef,cDepth+1);
			}

			if (tabledef["rows"]["alter"]){
				tabledef["rows"]["alter"](jqRow,aNode,nRow,cDepth);
			}
		});
	};


	//------------------------------------------------------------------------
	// fjqTableFromTableDef
	//   construct a table accorinding to the table definition for the given 
	//   tree
	// 
	// Params
	//   jqParent := destination for table
	//   tabledef := the table definition
	//   vaNode   := the tree
	//
	// Scope => Private
	//
	var fjqTableFromTableDef = function(jqParent, tabledef, vaNode){
		vaNode = vaNode || [];

		var jqTable   = fjqNew("table",jqParent,{"class": tabledef["class"] || ""});
		var jqHeadRow = fjqNew("tr",fjqNew("thead",jqTable));

		tabledef["columns"].each(function(aColumn,n){
			fAddCellContent(
				fjqNew("th",jqHeadRow), 
				aColumn.heading,
				tabledef.header || {}, 
				aColumn, 
				tabledef,
				0
			);
		});

		fAddRows(jqTable, vaNode, tabledef, 0);

		return jqTable;
	};



	//------------------------------------------------------------------------
	// fRecursiveSort
	//  sorts a tree accoriding to the specification of a given column
	// 
	// Params:
	//   vaNode   := the tree
	//   aColumn  := the column specification
	//               important fields:
	//       value     := field or function nominally used for sorting
	//       sortvalue := field or function used for sorting, overrides value
	//       comparator:= function used to compare the sorting value
	//       sort      := {"up", "down"} sort direction
	//
	//     
	var fRecursiveSort = function(vaNode, aColumn){
		var xSortvalue = aColumn.value;
		if (aColumn.sortvalue){
			xSortvalue=aColumn.sortvalue;
		}

		if (!nsTypes.fbIsFunction(xSortvalue)){
			xSortvalue=(
				function(sKey){
					return function(a){
						return a[sKey];
					};
				}
			)(xSortvalue);
		}

		var fCompare;
		if (aColumn.comparator){
			fCompare=aColumn.comparator;
		}
		else{
			fCompare = function(s1,s2){ return s1>s2?-1:1;};
		}

		var fSort;
		if (aColumn.sort === "up"){
			fSort = function(a1,a2){
				return fCompare(xSortvalue(a1), xSortvalue(a2));
			};
		}
		else{
			fSort = function(a1,a2){
				return -fCompare(xSortvalue(a1), xSortvalue(a2));
			};
		}

		//------------------------------
		// recursively sort the tree
		var fDoSort = function(vaNode, f){
			vaNode.each(function(a){
				if (a.children){
					a.children = fDoSort(a.children,f);
				}
			});

			return vaNode.sort(f);
		};
		fDoSort(vaNode,fSort);

	};



	//------------------------------------------------------------------------
	// fAddSortFunctionality
	//   add click to sort functionality to table
	//
	// Params
	///  jqTable  := the table
	//   tabledef := the table specification
	//   vaNode   := the tree
	//
	// Scope => Private
	//
	var fAddSortFunctionality = function (jqTable, tabledef, vaNode){

		// make rows sortable, unless marked as unsortable
		$("th",jqTable).each(function(n){
			if (!tabledef.columns[n]["unsortable"]){
				$(this).bind(
					"click",
					function(event){
						var sSort;
						switch(tabledef.columns[n].sort){
						case "up":    sSort = "down"; break;
						case "down":  sSort = "up";   break;
						default:      sSort = "up";   break;
						}
						
						tabledef.columns.each(
							function(aColumn){
								aColumn.sort="none";
							}
						);

						tabledef.columns[n].sort=sSort;
						console.log(tabledef);
						fRecursiveSort(vaNode,tabledef.columns[n]);

						// redraw
						fTableTree(jqTable.parent(), tabledef, vaNode);
					}
				);
			}}
		);
	};

	//------------------------------------------------------------------------
	// fAddCollapseFunctionality
	//   adds click handler that make rows collapsible (unless marked as 
	//   uncollapsible). Collapse is accomplished by table redraw
	// 
	// Params
	///  jqTable  := the table
	//   tabledef := the table specification
	//   vaNode   := the tree
	//
	// Scope => Private
	//
	var fAddCollapseFunctionality = function(jqTable, tabledef, vaNode){
		// recursively make a flattened array of the nodes, to match 
		// the table rows
		var vaFlat=[];
		var fFlattenTree = function(vaNode){
			vaNode.each(function(aNode){
				vaFlat.push(aNode);
				if (!aNode.collapsed && aNode.children){
					fFlattenTree(aNode.children);
				}
			});
		};
		fFlattenTree(vaNode);

		jqTable.children("tbody").children("tr").each(function(n){
			if (!vaFlat[n].uncollapsable && vaFlat[n].children){
				$(this).bind(
					"click",
					function(){
						vaFlat[n].collapsed = !vaFlat[n].collapsed;

						// redraw
						fTableTree(jqTable.parent(), tabledef, vaNode);
					}
				);
			}
		});
	
	};


	//------------------------------------------------------------------------
	// fAddScrollFunctionality
	//   enable table to scroll while keeping header fixed
	// 
	//   Accomplised by converting the table head and body into display:block 
	//   elements, and resetting their width to be what they were when they were
	//   a table
	//   
	//   jqTable  := the table
	//   tabledef := the table specification
	//   vaNode   := the tree
	//
	var fAddScrollFunctionality = function(jqTable, tabledef, vaNode){
		var cWidthTable = jqTable.width();

		var jq = jqTable.find("th");

		var vcWidth=[];
		var cT =0;
		jq.each(function(n,e){
			var cW = $(e).width();
			cT += cW;
			vcWidth[n] = cW;
/*
			// NOTE: not sure why we need the +1 here, but it seems to make sure 
			// the headers are the right size?
			vcWidth[n] += 1;
*/

		});

		var c=vcWidth.length;
		var d = cWidthTable - cT;
		
		vcWidth = vcWidth.map(function(cWidth,n){
			return cWidth + Math.floor(d/c);
		});

		jqTable.find("thead").css({	display:"block"	});
		jqTable.find("tbody").css({	display:"block"	});


		jqTable.find("th").each(function(n,e){
			$(e).css({"width":vcWidth[n], "max-width":vcWidth[n]});
		});

		jqTable.find("tr").each(function(nTr,eTr){
			$(eTr).find("td").each(function(n,e){
				$(e).css({"width":vcWidth[n],"max-width":vcWidth[n]});
			});
		});

	};


	//------------------------------------------------------------------------
	// fSetDefaultCollapsedState
	//   traverses a node tree and sets any unset .collapse fields to the 
	//   given default
	//
	// Params
	//   vaNode := tree
	//   bCollapseDefault := default value for .collapse field
	//
	// Side Effects
	//   vaNode modified
	var fSetDefaultCollapsedState = function(vaNode,bCollapseDefault){
		vaNode.each(function(aNode){
			if (aNode.children){
				if (typeof(aNode.collapsed)==="undefined"){
					aNode.collapsed = bCollapseDefault;
				}
				fSetDefaultCollapsedState(aNode.children,bCollapseDefault);
			}
		});
	};

	//------------------------------------------------------------------------
	// imports
	var fjqNew = nsJQTools.fjqNew;

	//------------------------------------------------------------------------
	return fTableTree;
})();
