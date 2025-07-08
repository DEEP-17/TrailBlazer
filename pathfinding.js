// Pathfinding algorithms implementation
class PathfindingAlgorithms {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
    }

    // Dijkstra's Algorithm implementation
    async dijkstra(startNode, endNode, nodes, edges) {
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();

        // Initialize distances
        for (let node of nodes) {
            distances.set(node, Infinity);
            previous.set(node, null);
            unvisited.add(node);
        }
        distances.set(startNode, 0);

        while (unvisited.size > 0) {
            // Find unvisited node with minimum distance
            let currentNode = null;
            let minDistance = Infinity;
            
            for (let node of unvisited) {
                if (distances.get(node) < minDistance) {
                    minDistance = distances.get(node);
                    currentNode = node;
                }
            }

            if (currentNode === null || minDistance === Infinity) {
                break;
            }

            unvisited.delete(currentNode);

            // If we reached the destination
            if (currentNode === endNode) {
                break;
            }

            // Check neighbors
            const neighbors = edges.get(currentNode) || [];
            for (let neighbor of neighbors) {
                if (unvisited.has(neighbor.node)) {
                    const alt = distances.get(currentNode) + neighbor.weight;
                    if (alt < distances.get(neighbor.node)) {
                        distances.set(neighbor.node, alt);
                        previous.set(neighbor.node, currentNode);
                    }
                }
            }

            // Add visual delay for demonstration
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return this.reconstructPath(previous, startNode, endNode);
    }

    // Reconstruct path from previous nodes
    reconstructPath(previous, startNode, endNode) {
        const path = [];
        let currentNode = endNode;

        while (currentNode !== null) {
            path.unshift(currentNode);
            currentNode = previous.get(currentNode);
        }

        // Return path only if it starts with startNode
        return path.length > 0 && path[0] === startNode ? path : [];
    }

    // Haversine distance for geographic coordinates
    haversineDistance(node1, node2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(node2.lat - node1.lat);
        const dLon = this.toRadians(node2.lon - node1.lon);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(node1.lat)) * Math.cos(this.toRadians(node2.lat)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Create graph from route points for algorithm visualization
    createGraphFromRoute(routePoints) {
        const nodes = [];
        const edges = new Map();

        // Create nodes
        routePoints.forEach((point, index) => {
            nodes.push({
                id: index,
                lat: point[0],
                lon: point[1],
                x: point[1], // longitude as x
                y: point[0]  // latitude as y
            });
        });

        // Create edges (connections between consecutive points)
        for (let i = 0; i < nodes.length - 1; i++) {
            const currentNode = nodes[i];
            const nextNode = nodes[i + 1];
            const weight = this.haversineDistance(currentNode, nextNode);

            if (!edges.has(currentNode)) {
                edges.set(currentNode, []);
            }
            if (!edges.has(nextNode)) {
                edges.set(nextNode, []);
            }

            edges.get(currentNode).push({ node: nextNode, weight });
            edges.get(nextNode).push({ node: currentNode, weight });
        }

        return { nodes, edges };
    }

    // Simulate Dijkstra's pathfinding on actual route
    async simulatePathfinding(startPoint, endPoint, waypoints = []) {
        // Create a simplified graph for demonstration
        const routePoints = [
            [startPoint.getLatLng().lat, startPoint.getLatLng().lng],
            ...waypoints.map(wp => [wp.getLatLng().lat, wp.getLatLng().lng]),
            [endPoint.getLatLng().lat, endPoint.getLatLng().lng]
        ];

        const { nodes, edges } = this.createGraphFromRoute(routePoints);
        const startNode = nodes[0];
        const endNode = nodes[nodes.length - 1];

        const path = await this.dijkstra(startNode, endNode, nodes, edges);

        return {
            path,
            nodes,
            edges,
            algorithm: 'dijkstra',
            pathLength: path.length > 0 ? this.calculatePathLength(path) : 0
        };
    }

    // Calculate total path length
    calculatePathLength(path) {
        let totalDistance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            totalDistance += this.haversineDistance(path[i], path[i + 1]);
        }
        return totalDistance;
    }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathfindingAlgorithms;
} else {
    window.PathfindingAlgorithms = PathfindingAlgorithms;
}
