import * as fs from "node:fs";
import * as path from "node:path";

interface Task {
  id: string;
  description: string;
  status: string;
  dependsOn: string[];
}

interface GraphifyData {
  metadata: {
    lastUpdated: string;
    currentTask: string;
    completedTasks: string[];
    blockedTasks: string[];
  };
  tasks: Task[];
}

const graphifyPath = path.resolve(__dirname, "../graphify.json");

function loadGraph(): GraphifyData {
  const raw = fs.readFileSync(graphifyPath, "utf-8");
  return JSON.parse(raw) as GraphifyData;
}

function saveGraph(data: GraphifyData): void {
  fs.writeFileSync(graphifyPath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

function markComplete(taskId: string): void {
  const data = loadGraph();
  const task = data.tasks.find((t) => t.id === taskId);

  if (!task) {
    console.error(`Task ${taskId} not found in graphify.json`);
    process.exit(1);
  }

  if (task.status === "completed") {
    console.log(`Task ${taskId} is already marked as completed.`);
    return;
  }

  task.status = "completed";
  data.metadata.lastUpdated = new Date().toISOString();

  if (!data.metadata.completedTasks.includes(taskId)) {
    data.metadata.completedTasks.push(taskId);
  }

  // Determine next available tasks (all dependencies completed, still pending)
  const completedSet = new Set(data.metadata.completedTasks);
  const nextTasks = data.tasks.filter(
    (t) => t.status === "pending" && t.dependsOn.every((dep) => completedSet.has(dep)),
  );

  if (nextTasks.length > 0) {
    data.metadata.currentTask = nextTasks[0].id;
  } else {
    data.metadata.currentTask = "";
  }

  saveGraph(data);
  printStatus(data);
}

function printStatus(data: GraphifyData): void {
  console.log("\n--- Graphify Task Status ---\n");
  console.log(`Last Updated: ${data.metadata.lastUpdated}`);
  console.log(`Current Task: ${data.metadata.currentTask || "none"}`);
  console.log(`Completed: ${data.metadata.completedTasks.length}/${data.tasks.length}\n`);

  for (const task of data.tasks) {
    const icon = task.status === "completed" ? "[x]" : "[ ]";
    const deps = task.dependsOn.length > 0 ? ` (deps: ${task.dependsOn.join(", ")})` : "";
    console.log(`  ${icon} ${task.id}: ${task.description}${deps}`);
  }
  console.log("");
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  // No argument: just print status
  const data = loadGraph();
  printStatus(data);
} else {
  const taskId = args[0].toUpperCase();
  markComplete(taskId);
}
