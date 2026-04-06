  import cluster from "cluster";
  import os from "os";
  import { bootstrap } from "./start";

cluster.schedulingPolicy = cluster.SCHED_NONE;

  if (cluster.isPrimary) {

    const numCPUs = os.cpus().length;

    console.log(`Primary ${process.pid} running`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
    cluster.on("exit", (worker) => {
      console.log(`Worker ${worker.process.pid} died`);
      cluster.fork();
    });

  } else {
    bootstrap(); 
  }