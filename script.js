document.addEventListener('DOMContentLoaded', function() {
    // Navigation system
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main section');
    
    navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const sectionId = this.getAttribute('data-section');
        
        // Update active nav link
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding section
        sections.forEach(section => {
            section.classList.remove('active-section');
            if (section.id === sectionId) {
                section.classList.add('active-section');

                if (sectionId === 'visual') {
                    plot2DVectors();
                    plot3DVectors();
                }
                else if (sectionId === 'basis') {
                    plotBasisVisualization(); // Add this line
                }

                if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                    MathJax.typesetPromise([section]);
                }
            }
        });
    });
    });

    // Initialize SVG arrowhead markers for vector plots
    function initArrowMarkers() {
    const plots = [
        document.getElementById('2d-plot'),
        document.getElementById('dependent-example-graph'),
        document.getElementById('independent-example-graph'),
        document.getElementById('span-visualization'),
        document.getElementById('basis-visualization') // Add this line
    ];
    
    plots.forEach(plot => {
        if (!plot) return;
        
        const svgNS = "http://www.w3.org/2000/svg";
        const defs = document.createElementNS(svgNS, "defs");
        const marker = document.createElementNS(svgNS, "marker");
        
        marker.setAttribute("id", "arrowhead");
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        
        const arrow = document.createElementNS(svgNS, "polygon");
        arrow.setAttribute("points", "0 0, 10 3.5, 0 7");
        arrow.setAttribute("fill", "#666");
        
        marker.appendChild(arrow);
        defs.appendChild(marker);
        plot.appendChild(defs);
    });
    }   

    // Create a 2D coordinate system with D3.js
    function createCoordinateSystem(container, width, height) {
        const margin = 20;
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = 30; // Increased scale for better visibility
        const axisRange = 8; // From -8 to 8 (reduced range for better focus)
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'vector-plot');
        
        // Add grid background
        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', '#f8f8f8');
        
        // Add grid
        const gridGroup = svg.append('g');
        
        // Vertical grid lines
        for (let x = -axisRange; x <= axisRange; x++) {
            gridGroup.append('line')
                .attr('x1', centerX + x * scale)
                .attr('y1', margin)
                .attr('x2', centerX + x * scale)
                .attr('y2', height - margin)
                .attr('stroke', x === 0 ? '#aaa' : '#ddd')
                .attr('stroke-width', x === 0 ? 1.5 : 1)
                .attr('stroke-dasharray', x === 0 ? 'none' : '2,2');
        }
        
        // Horizontal grid lines
        for (let y = -axisRange; y <= axisRange; y++) {
            gridGroup.append('line')
                .attr('x1', margin)
                .attr('y1', centerY + y * scale)
                .attr('x2', width - margin)
                .attr('y2', centerY + y * scale)
                .attr('stroke', y === 0 ? '#aaa' : '#ddd')
                .attr('stroke-width', y === 0 ? 1.5 : 1)
                .attr('stroke-dasharray', y === 0 ? 'none' : '2,2');
        }
        
        // Add axis lines (thicker)
        svg.append('line')
            .attr('x1', margin)
            .attr('y1', centerY)
            .attr('x2', width - margin)
            .attr('y2', centerY)
            .attr('stroke', '#555')
            .attr('stroke-width', 2);
        
        svg.append('line')
            .attr('x1', centerX)
            .attr('y1', margin)
            .attr('x2', centerX)
            .attr('y2', height - margin)
            .attr('stroke', '#555')
            .attr('stroke-width', 2);
        
        // Add axis labels with numbers
        for (let x = -axisRange; x <= axisRange; x++) {
            if (x !== 0) {
                svg.append('text')
                    .attr('x', centerX + x * scale)
                    .attr('y', centerY + 15)
                    .text(x)
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#666')
                    .style('font-size', '10px');
            }
        }
        
        for (let y = -axisRange; y <= axisRange; y++) {
            if (y !== 0) {
                svg.append('text')
                    .attr('x', centerX + 15)
                    .attr('y', centerY - y * scale)
                    .text(y)
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#666')
                    .style('font-size', '10px');
            }
        }
        
        // Add axis titles
        svg.append('text')
            .attr('x', width - margin - 5)
            .attr('y', centerY - 5)
            .text('x')
            .attr('fill', '#555')
            .style('font-weight', 'bold');
        
        svg.append('text')
            .attr('x', centerX + 5)
            .attr('y', margin + 15)
            .text('y')
            .attr('fill', '#555')
            .style('font-weight', 'bold');
        
        return { svg, centerX, centerY, scale, margin };
    }

    // Plot 2D vectors with D3.js
    function plot2DVectors() {
        const plotContainer = document.getElementById('2d-plot');
        if (!plotContainer) return;
        
        // Clear previous plot
        plotContainer.innerHTML = '';
        
        // Get input values
        const vector1Input = document.getElementById('vector1').value;
        const vector2Input = document.getElementById('vector2').value;
        
        // Parse vectors
        const v1 = vector1Input.split(',').map(Number);
        const v2 = vector2Input.split(',').map(Number);
        
        // Validate input
        if (v1.length !== 2 || v2.length !== 2 || v1.some(isNaN) || v2.some(isNaN)) {
            plotContainer.innerHTML = '<p>Please enter valid 2D vectors in format "x,y"</p>';
            return;
        }
        
        // Check linear independence
        const det = v1[0] * v2[1] - v1[1] * v2[0];
        const isIndependent = Math.abs(det) > 1e-10; // Account for floating point precision
        
        // Display conclusion
        const conclusion = document.getElementById('2d-conclusion');
        conclusion.innerHTML = isIndependent 
            ? `<p>Vectors are <strong>linearly independent</strong> (determinant = ${det.toFixed(2)} ≠ 0)</p>`
            : `<p>Vectors are <strong>linearly dependent</strong> (determinant = 0)</p>`;
        
        // Set up coordinate system
        const width = plotContainer.clientWidth;
        const height = plotContainer.clientHeight;
        const { svg, centerX, centerY, scale } = createCoordinateSystem(plotContainer, width, height);
        
        // Plot vectors with school colors
        const plotVector = (x, y, color, label) => {
            // Vector line
            svg.append('line')
                .attr('x1', centerX)
                .attr('y1', centerY)
                .attr('x2', centerX + x * scale)
                .attr('y2', centerY - y * scale) // SVG y-axis is inverted
                .attr('stroke', color)
                .attr('stroke-width', 2)
                .attr('marker-end', 'url(#arrowhead)');
            
            // Vector label
            svg.append('text')
                .attr('x', centerX + x * scale / 2 + 5)
                .attr('y', centerY - y * scale / 2 - 5)
                .text(label)
                .attr('fill', color)
                .style('font-weight', 'bold')
                .style('font-size', '12px');
        };
        
        // Plot the vectors
        plotVector(v1[0], v1[1], '#001F3F', `(${v1[0]},${v1[1]})`);
        plotVector(v2[0], v2[1], '#FFD700', `(${v2[0]},${v2[1]})`);
        
        // Add title showing the relationship
        svg.append('text')
            .attr('x', centerX)
            .attr('y', 20)
            .text(isIndependent ? 'Independent Vectors' : 'Dependent Vectors')
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('fill', isIndependent ? '#2ecc71' : '#e74c3c');
    }

    // Plot example vectors in definition section
    function plotExampleVectors() {
        // Dependent example: (1,2) and (2,4)
        const depContainer = document.getElementById('dependent-example-graph');
        if (depContainer) {
            depContainer.innerHTML = '';
            const width = depContainer.clientWidth;
            const height = depContainer.clientHeight;
            
            const { svg, centerX, centerY, scale } = createCoordinateSystem(depContainer, width, height);
            
            // Plot dependent vectors
            plotVector(svg, centerX, centerY, scale, 1, 2, '#001F3F', 'v₁ (1,2)');
            plotVector(svg, centerX, centerY, scale, 2, 4, '#FFD700', 'v₂ (2,4)');
            
            // Add title
            svg.append('text')
                .attr('x', centerX)
                .attr('y', 20)
                .text('Dependent Vectors (v₂ = 2 × v₁)')
                .attr('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .style('fill', '#e74c3c')
                .style('font-size', '14px');
        }
        
        // Independent example: (1,0) and (0,1)
        const indepContainer = document.getElementById('independent-example-graph');
        if (indepContainer) {
            indepContainer.innerHTML = '';
            const width = indepContainer.clientWidth;
            const height = indepContainer.clientHeight;
            
            const { svg, centerX, centerY, scale } = createCoordinateSystem(indepContainer, width, height);
            
            // Plot independent vectors
            plotVector(svg, centerX, centerY, scale, 1, 0, '#001F3F', '(1,0)');
            plotVector(svg, centerX, centerY, scale, 0, 1, '#FFD700', '(0,1)');
            
            // Add title
            svg.append('text')
                .attr('x', centerX)
                .attr('y', 20)
                .text('Independent Vectors (Standard Basis)')
                .attr('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .style('fill', '#2ecc71')
                .style('font-size', '14px');
        }
    }

    // Interactive independence checker
    function setupInteractiveChecker() {
        const checkBtn = document.getElementById('check-independence');
        if (!checkBtn) return;
        
        checkBtn.addEventListener('click', function() {
            const input = document.getElementById('problem-vectors').value.trim();
            const resultDiv = document.getElementById('problem-result');
            
            // Parse input
            const vectors = input.split('),').map(v => 
                v.replace(/[()\s]/g, '').split(',').map(Number)
            ).filter(v => v.length > 0 && !v.some(isNaN));
            
            // Validate input
            if (vectors.length < 2 || vectors.some(v => v.length !== vectors[0].length)) {
                resultDiv.innerHTML = '<p class="error">Please enter at least two vectors of the same dimension in format (1,2), (3,4)</p>';
                return;
            }
            
            // Check for independence using matrix rank
            const matrix = vectors[0].map((_, i) => vectors.map(v => v[i]));
            const rank = getMatrixRank(matrix);
            const isIndependent = rank === vectors.length;
            
            // Display result
            resultDiv.innerHTML = `
                <p><strong>Vectors entered:</strong> ${vectors.map(v => `(${v.join(',')})`).join(', ')}</p>
                <p><strong>Matrix rank:</strong> ${rank} (out of ${vectors.length} vectors)</p>
                <p class="${isIndependent ? 'success' : 'error'}">
                    Vectors are <strong>${isIndependent ? 'linearly independent' : 'linearly dependent'}</strong>
                </p>
                ${!isIndependent ? 
                    `<p>Dependence relationship: ${findDependenceRelationship(vectors)}</p>` : 
                    ''}
            `;
        });
    }

    // Helper function to calculate matrix rank
    function getMatrixRank(matrix) {
        // Simplified row reduction for rank calculation
        const rows = matrix.length;
        const cols = matrix[0].length;
        let rank = Math.min(rows, cols);
        
        // Create a copy to work with
        const mat = matrix.map(row => [...row]);
        
        for (let row = 0; row < rank; row++) {
            // Diagonal element is non-zero
            if (mat[row][row] !== 0) {
                for (let col = 0; col < rows; col++) {
                    if (col !== row) {
                        const mult = mat[col][row] / mat[row][row];
                        for (let i = 0; i < rank; i++) {
                            mat[col][i] -= mult * mat[row][i];
                        }
                    }
                }
            } else {
                let reduce = true;
                
                // Find a row below to swap with
                for (let i = row + 1; i < rows; i++) {
                    if (mat[i][row] !== 0) {
                        [mat[row], mat[i]] = [mat[i], mat[row]];
                        reduce = false;
                        break;
                    }
                }
                
                // If all elements in current column below mat[row][row] are 0
                if (reduce) {
                    rank--;
                    for (let i = 0; i < rows; i++) {
                        mat[i][row] = mat[i][rank];
                    }
                }
                
                row--;
            }
        }
        
        return rank;
    }

    // Helper function to find dependence relationship
    function findDependenceRelationship(vectors) {
        // For simplicity, we'll just handle the 2D case
        if (vectors.length === 2 && vectors[0].length === 2) {
            const [v1, v2] = vectors;
            const det = v1[0] * v2[1] - v1[1] * v2[0];
            
            if (Math.abs(det) < 1e-10) {
                const ratio = v1[0] / v2[0];
                return `v₁ = ${ratio.toFixed(2)} × v₂`;
            }
        }
        return "Non-trivial relationship exists (requires solving system)";
    }

    function plotSpanVisualization() {
        const container = document.getElementById('span-visualization');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Get input values
        const v1 = document.getElementById('span-vector1').value.split(',').map(Number);
        const v2 = document.getElementById('span-vector2').value.split(',').map(Number);
        
        // Validate input
        if (v1.length !== 2 || v2.length !== 2 || v1.some(isNaN) || v2.some(isNaN)) {
            container.innerHTML = '<p>Please enter valid 2D vectors in format "x,y"</p>';
            return;
        }
        
        // Set up coordinate system
        const width = container.clientWidth;
        const height = container.clientHeight;
        const { svg, centerX, centerY, scale } = createCoordinateSystem(container, width, height);
        
        // Plot vectors
        plotVector(svg, centerX, centerY, scale, v1[0], v1[1], '#001F3F');
        plotVector(svg, centerX, centerY, scale, v2[0], v2[1], '#FFD700');
        
        // Calculate if they're independent
        const det = v1[0] * v2[1] - v1[1] * v2[0];
        const isIndependent = Math.abs(det) > 1e-10;
        
        // Plot span (simulated with many linear combinations)
        if (isIndependent) {
            // For independent vectors, show a grid representing the plane
            for (let a = -3; a <= 3; a++) {
                for (let b = -3; b <= 3; b++) {
                    const x = a * v1[0] + b * v2[0];
                    const y = a * v1[1] + b * v2[1];
                    
                    svg.append('circle')
                        .attr('cx', centerX + x * scale)
                        .attr('cy', centerY - y * scale)
                        .attr('r', 2)
                        .attr('fill', 'rgba(0, 31, 63, 0.2)');
                }
            }
            
            svg.append('text')
                .attr('x', centerX)
                .attr('y', 20)
                .text('Span: Entire Plane (Independent Vectors)')
                .attr('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .style('fill', '#2ecc71');
        } else {
            // For dependent vectors, show the line they span
            const linePoints = [];
            for (let t = -10; t <= 10; t += 0.5) {
                linePoints.push({
                    x: centerX + t * v1[0] * scale,
                    y: centerY - t * v1[1] * scale
                });
            }
            
            svg.append('path')
                .attr('d', d3.line()(linePoints))
                .attr('stroke', 'rgba(0, 31, 63, 0.3)')
                .attr('stroke-width', 3)
                .attr('fill', 'none');
                
            svg.append('text')
                .attr('x', centerX)
                .attr('y', 20)
                .text('Span: Line (Dependent Vectors)')
                .attr('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .style('fill', '#e74c3c');
        }
    }

    function plotBasisVisualization() {
        const container = document.getElementById('basis-visualization');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Standard basis vectors
        const v1 = [1, 0];
        const v2 = [0, 1];
        
        // Set up coordinate system
        const width = container.clientWidth;
        const height = container.clientHeight;
        const { svg, centerX, centerY, scale } = createCoordinateSystem(container, width, height);
        
        // Plot basis vectors
        plotVector(svg, centerX, centerY, scale, v1[0], v1[1], '#001F3F', '(1,0)');
        plotVector(svg, centerX, centerY, scale, v2[0], v2[1], '#FFD700', '(0,1)');
        
        // Add title
        svg.append('text')
            .attr('x', centerX)
            .attr('y', 20)
            .text('Standard Basis for ℝ²')
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('fill', '#001F3F')
            .style('font-size', '14px');
        
        // Add explanation
        svg.append('foreignObject')
            .attr('x', centerX - 100)
            .attr('y', height - 60)
            .attr('width', 200)
            .attr('height', 50)
            .append('xhtml:div')
            .style('text-align', 'center')
            .style('font-size', '12px')
            .html('<p>Any vector in ℝ² can be expressed as a combination of these basis vectors</p>');
    }

// Helper function to plot a vector (extracted from existing code)
    function plotVector(svg, centerX, centerY, scale, x, y, color, label) {
        // Calculate vector end points
        const endX = centerX + x * scale;
        const endY = centerY - y * scale;
        
        // Vector line
        svg.append('line')
            .attr('x1', centerX)
            .attr('y1', centerY)
            .attr('x2', endX)
            .attr('y2', endY)
            .attr('stroke', color)
            .attr('stroke-width', 3)
            .attr('marker-end', 'url(#arrowhead)');
        
        // Vector label
        svg.append('text')
            .attr('x', endX + (x > 0 ? 10 : -10))
            .attr('y', endY + (y > 0 ? -5 : 15))
            .text(label || `(${x},${y})`)
            .attr('fill', color)
            .style('font-weight', 'bold')
            .style('font-size', '12px')
            .attr('text-anchor', x > 0 ? 'start' : 'end');
        
        // Add a small circle at the origin point
        svg.append('circle')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', 3)
            .attr('fill', '#555');
    }

    // Initialize all components
    function initialize() {
        initArrowMarkers();
        plotExampleVectors();
        plot2DVectors();
        setupInteractiveChecker();
        plotBasisVisualization();
        
        // Event listeners
        document.getElementById('plot-vectors')?.addEventListener('click', plot2DVectors);
        document.getElementById('plot-span')?.addEventListener('click', plotSpanVisualization);
        
        // Initialize MathJax
        if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise();
        }
    }

    // Start the application
    initialize();
});