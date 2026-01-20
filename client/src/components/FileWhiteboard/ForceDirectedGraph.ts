/**
 * Force-directed graph layout algorithm
 * Simulates forces between nodes to create organic positioning
 */

export interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Edge {
  source: string;
  target: string;
}

export interface ForceParams {
  linkStrength: number; // How hard connected nodes pull together (0-1)
  repulsionStrength: number; // How hard all nodes push apart (higher = more repulsion)
  centerGravity: number; // Pull toward center (0-1)
  damping: number; // Friction/damping (0-1, closer to 1 = more damping)
  maxVelocity: number; // Max speed nodes can move
}

const DEFAULT_PARAMS: ForceParams = {
  linkStrength: 0.1,
  repulsionStrength: 400, // Increased for larger cards
  centerGravity: 0.02,
  damping: 0.8,
  maxVelocity: 5,
};

export class ForceDirectedGraph {
  private nodes: Map<string, Node> = new Map();
  private edges: Edge[] = [];
  private params: ForceParams;
  private centerX: number;
  private centerY: number;
  private width: number;
  private height: number;

  constructor(
    width: number = 1000,
    height: number = 800,
    params: Partial<ForceParams> = {}
  ) {
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  /**
   * Initialize nodes with random or grid positions
   */
  addNodes(nodeIds: string[]) {
    nodeIds.forEach((id, index) => {
      const existingNode = this.nodes.get(id);
      if (existingNode) return; // Keep existing position

      let x, y;

      // If dimensions are too small, use grid layout
      if (this.width < 100 || this.height < 100) {
        const cols = Math.ceil(Math.sqrt(nodeIds.length));
        const col = index % cols;
        const row = Math.floor(index / cols);
        x = col * 320 + 100; // Increased spacing for larger cards (280px + 40px gap)
        y = row * 200 + 100; // Increased spacing for larger cards (160px + 40px gap)
      } else {
        // Random position within bounds with some padding
        const padding = 100;
        x = Math.random() * (this.width - 2 * padding) + padding;
        y = Math.random() * (this.height - 2 * padding) + padding;
      }

      this.nodes.set(id, {
        id,
        x,
        y,
        vx: 0,
        vy: 0,
      });
    });
  }

  /**
   * Set edges between nodes
   */
  setEdges(edges: Edge[]) {
    this.edges = edges;
  }

  /**
   * Run simulation for N iterations
   */
  simulate(iterations: number = 50) {
    for (let i = 0; i < iterations; i++) {
      this.simulateStep();
    }
  }

  /**
   * Single simulation step
   */
  private simulateStep() {
    // Reset forces
    const forces = new Map<string, { fx: number; fy: number }>();
    this.nodes.forEach((node) => {
      forces.set(node.id, { fx: 0, fy: 0 });
    });

    // Apply repulsion forces (all nodes push apart)
    const nodeArray = Array.from(this.nodes.values());
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const nodeA = nodeArray[i];
        const nodeB = nodeArray[j];
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDistance = 250; // Minimum distance before repulsion (increased for larger cards)

        if (distance < minDistance * 3) {
          // Only repel if reasonably close
          const repulsionForce =
            (this.params.repulsionStrength / (distance * distance)) *
            Math.min(1, minDistance / distance);
          const fx = (dx / distance) * repulsionForce;
          const fy = (dy / distance) * repulsionForce;

          const forceA = forces.get(nodeA.id)!;
          const forceB = forces.get(nodeB.id)!;
          forceA.fx -= fx;
          forceA.fy -= fy;
          forceB.fx += fx;
          forceB.fy += fy;
        }
      }
    }

    // Apply attraction forces (connected nodes pull together)
    this.edges.forEach((edge) => {
      const nodeA = this.nodes.get(edge.source);
      const nodeB = this.nodes.get(edge.target);
      if (!nodeA || !nodeB) return;

      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDistance = 200; // Desired distance between connected nodes (increased for larger cards)

      const attractionForce =
        this.params.linkStrength * (distance - targetDistance);
      const fx = (dx / distance) * attractionForce;
      const fy = (dy / distance) * attractionForce;

      const forceA = forces.get(nodeA.id)!;
      const forceB = forces.get(nodeB.id)!;
      forceA.fx += fx;
      forceA.fy += fy;
      forceB.fx -= fx;
      forceB.fy -= fy;
    });

    // Apply centering force
    this.nodes.forEach((node) => {
      const dx = this.centerX - node.x;
      const dy = this.centerY - node.y;
      const force = forces.get(node.id)!;
      force.fx += dx * this.params.centerGravity;
      force.fy += dy * this.params.centerGravity;
    });

    // Update velocities and positions
    this.nodes.forEach((node) => {
      const force = forces.get(node.id)!;

      // Update velocity with damping
      node.vx = (node.vx + force.fx) * this.params.damping;
      node.vy = (node.vy + force.fy) * this.params.damping;

      // Limit velocity
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > this.params.maxVelocity) {
        node.vx = (node.vx / speed) * this.params.maxVelocity;
        node.vy = (node.vy / speed) * this.params.maxVelocity;
      }

      // Update position
      node.x += node.vx;
      node.y += node.vy;

      // Keep nodes within bounds
      const padding = 50;
      node.x = Math.max(padding, Math.min(this.width - padding, node.x));
      node.y = Math.max(padding, Math.min(this.height - padding, node.y));
    });
  }

  /**
   * Get current positions
   */
  getPositions(): Record<string, { x: number; y: number }> {
    const positions: Record<string, { x: number; y: number }> = {};
    this.nodes.forEach((node) => {
      positions[node.id] = { x: node.x, y: node.y };
    });
    return positions;
  }

  /**
   * Set a node's position manually (for user drag)
   */
  setNodePosition(nodeId: string, x: number, y: number) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.x = x;
      node.y = y;
    }
  }

  /**
   * Get all nodes (for debugging)
   */
  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }
}
