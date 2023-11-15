# Distributed Algorithms
* These notes are not lecture notes!
* They are notes that summarize the specifications, properties and pseudo-code of the main distributed algorithms used in industry, from a theoretical point of view (we look at the existence of these algorithms, not their efficiency).
* These notes may help in developping the building blocks of communication in a distributed system.
* The order in which the algorithms are presented follow the one given in Rachid Guerraoui's [Distributed Algorithms](https://dcl.epfl.ch/site/education/da) course at EPFL.

## Assumptions
* **Timing assumptions:** In what follows, we consider the system to be fully asynchronous, unless stated explicitly. For example, one cannot make any time bounds assumptions.

* **Failure detection:** To detect process crashes we rely on an object called a failure detector. It can be either perfect, or eventually perfect. In practice one cannot have access to a perfect failure detector under a fully asynchronous regime. 

    * **Perfect Failure Detector:**
        * **PFD1.** Strong Completeness: Eventually, every process that crashes is permanently suspected by every correct process.
        * **PFD2.** Strong accuracy: If a process $p$ is detected by any process, then $p$ has crashed.
        ```yaml
        Module:
            Name: PerfectFailureDetector (P)

        Events:
            Indication: <crash, p>: indicates that process p has crashed

        Properties:
            PFD1, PFD2
        ```
    * **Eventually Perfect Failure Detector:**
        * **EPFD1.** Strong completeness = **PFD1.**
        * **EPFD2.** Eventual Strong Accuracy: Eventually, no correct process is ever suspected by any correct process.
        ```yaml
        Module:
            Name: EventualPerfectFailureDetector (EP)

        Events:
            Indication: <suspect, p>: suspects that process p has crashed
            Indication: <restore, p>: restores process p as not crashed

        Properties:
            EPFD1, EPFD2
        ```

* **Notation:** Processes are denoted as $p$, $q$, $p_i$, $q_i$. Messages are denoted as $m$, $n$, $m_i$, $n_i$. If a process is correct, then it never crashes.

## Links
### Fair-Loss Link (FLL)

* **FLL1.** Fair Loss: If a correct process $p$ sends a message $m$ to $q$ infinitely often, then $q$ delivers $m$ an infinite number of times.
* **FLL2.** Finite Duplication: If a correct process $p$ sends message $m$ to $q$ a finite number of times, then $m$ cannot be delivered an infinite number of times by $q$.
* **FLL3.** No Creation: If some process $q$ delivers message $m$ with sender $p$, then $m$ was sent to $q$ by $p$.

These are assumptions on the network link we are working with. This can be seen as properties coming from UDP. The following gives the interface of the link:

```yaml
Module:
    Name: FairLossLink (flp2p)

Events:
    Request: <flp2pSend, dest, m>: requests to send message m to process dest
    Indication: <flp2pDeliver, src, m>: delivers messages m sent by src

Properties:
    FLL1, FLL2, FLL3
```

### Stubborn Link (SB) - UDP-like

* **SL1.** Stubborn Delivery: If a correct process $p$ sends a message $m$ once to correct process $q$, then $q$ delivers $m$ an infinite number of times.
* **SL2.** No Creation: If some process $q$ delivers a message $m$ with sender $p$, then $m$ was previously sent to $q$ by $p$.

```yaml
Module: 
    Name: StubbornLink (sp2p)
Uses:
    FairLossLink (flp2p)

Events:
    Request: <sp2pSend, dest, m>: requests to send message m to dest
    Indication: <sp2pDeliver, src, m>: delivers message m sent by src

Properties:
    SL1, SL2
```
```
upon event <sp2pSend, dest, m> do:
    while (true) do:
        trigger <flp2pSend, dest, m>;

upon event <flp2pDeliver, src, m> do:
    trigger <sp2pDeliver, src, m>;
```
Note that in the above, although the algorithm sends each message an infinite number of times and practically this is extremely inefficient, it still satisfies the properties defined above, so the algorithm is correct. Remember that we concentrate on the existence of algorithms satisfying our properties, not on their performance.

### Perfect Link (PL) - TCP-like

* **PL1.** Reliable Delivery: If a correct process $p$ sends a message $m$ to a correct process $q$, then $q$ eventually delivers $m$.
* **PL2.** No Duplication: No message is delivered by a process more than once.
* **PL3.** No Creation: If some process $q$ delivers a message $m$ with sender $p$, then $m$ was previously sent to $q$ by $p$.

```yaml
Module: 
    Name: PerfectLink (pp2p)
Uses:
    StubbornLink (sp2p)

Events:
    Request: <pp2pSend, dest, m>: requests to send message m to dest
    Indication: <pp2pDeliver, src, m>: delivers message m sent by src

Properties:
    PL1, PL2, PL3
```
```
upon event <pp2p, Init> do:
    delivered := ∅;

upon event <pp2pSend, dest, m> do:
    trigger <sp2pSend, dest, m>;

upon event <sp2pDeliver, src, m> do:
    if m ∉ delivered:
        delivered := delivered ∪ {m};
        trigger <pp2pDeliver, src, m>;
```

## Broadcasts
### Best-Effort Broadcast (BEB)

* **BEB1.** Validity: If $p$ and $q$ are correct, then every message broadcast by $p$ is eventually delivered by $q$
* **BEB2.** No Duplication: No message is delivered more than once.
* **BEB3.** No Creation: If a process delivers a message $m$ with sender $p$, then $m$ was previously broadcast by $p$.

```yaml
Module: 
    Name: BestEffortBroadcast (beb)
Uses: 
    PerfectLink (pp2p)

Events:
    Request: <bebBroadcast, m>: broadcasts a message m to all processes
    Indication: <bebDeliver, src, m>: delivers a message m sent by src

Properties:
    BEB1, BEB2, BEB3
```
```
upon event <bebBroadcast, m> do:
    forall q ∈ Π do:
        trigger <pp2pSend, q, m>;

upon event <pp2pDeliver, src, m> do:
    trigger <bebDeliver, src, m>;
```

### Reliable Broadcast (RB)

* **RB1.** Validity = BEB1
* **RB2.** No Duplication = BEB2
* **RB3.** No Creation = BEB3
* **RB4.** Agreement: For any message $m$, if a correct process delivers $m$, then every correct process delivers $m$.

### Uniform Reliable Broadcast (URB)

* **URB1.** Validity = BEB1
* **URB2.** No duplication = BEB2
* **URB3.** No creation = BEB3
* **URB4.** Uniform Agreement: For any message $m$, if a process delivers $m$, then every correct process delivers $m$.

## Causal Order Broadcast (CB)
### Causal Order
$m_1$ *causally precedes* $m_2$ (denoted as $m_1 \rightarrow m_2$) if any of the following properties hold: 
* **FIFO Order.** Some process $p$ broadcasts $m_1$ before broadcasting $m_2$.
* **Causal Order:** Some process $p$ delivers $m_1$ and then broadcasts $m_2$.
* **Transitivity:** There is a message $m_3$ such that $m_1 \rightarrow m_3$ and $m_3 \rightarrow m_2$.  

Properties:
* **CB1.** Validity = RB1 = BEB1
* **CB2.** No Duplication = RB2 = BEB2
* **CB3.** No Creation = RB3 = BEB3
* **CB4.** Agreement = RB4
* **CB5.** Causal Order: If $m_1 \rightarrow m_2$ then any process $p$ delivering $m2$ has already delivered $m_1$.

### No-Waiting Version
### Waiting Version

## Total Order Broadcast (TOB) (Consensus-Based)
* **TOB1.** Validity = RB1 = BEB1
* **TOB2.** No Duplication = RB2 = BEB2
* **TOB3.** No Creation = RB3 = BEB3
* **(U)TOB4.** (Uniform) Agreement = (U)RB4
* **(U)TOB5.** (Uniform) Total Order: Let $m$ and $n$ be any two messages. Let $p$ be any (correct) process that delivers $m$ without having delivered $n$ before. Then no (correct) process delivers $n$ before $m$.

## Consensus (CONS)
* **C1.** Validity: If a value is decided, then it has been proposed.
* **(U)C2.** (Uniform) Agreement: No two correct processes decide differently.
* **C3.** Termination: Every correct process eventually decides.
* **C4.** Integrity: Every process decides at most once.

### Fail-Stop Consensus
Fail-stop == when a process fails, it crashes (no byzantine behavior) - it's an assumption
### Fail-Stop Uniform Consensus
### Fail-Stop Uniform Consensus With Timing Assumptions

## Atomic Commit
### Non-Blocking Atomic Commit (NBAC)
* **NBAC1.** Uniform Agreement: No two processes decide differently.
* **NBAC2.** Termination: Every correct process eventually decides.
* **NBAC3.** Commit-Validity: 1 can only be decided if all processes propose 1.
* **NBAC4.** Abort-Validity: 0 can only be decided if some process crashes or votes 0.

### 2-Phase Commit (2PC)
Blocking algorithm.
* **2PC1.** Uniform Agreement = NBAC1
* **2PC2.** Weak Termination: If a certain process $p$ is correct, then every correct process eventually decides.
* **2PC3.** Commit-Validity = NBAC3
* **2PC4.** Abort-Validity = NBAC4

## Terminating Reliable Broadcast (TRB)
* **TRB1.** Integrity: If a process delivers a message $m$, then either $m=\phi$, or $m$ is the message that was broadcast by $p_{src}$.
* **TRB2.** Validity: If the sender $p_{src}$ is correct and broadcasts a message $m$, then $p_{src}$ eventually delivers $m$.
* **(U)TRB3.** (Uniform) Agreement: For any message $m$, if any correct process delivers $m$, then every correct process delivers $m$
* **TRB4.** Termination: Every correct process eventually delivers exactly one message.

## Group Membership (GM)
* **GM1.** Local Monotonicity: If a process installs view $(j,M)$ after $(k,N)$, then $j > k$ and $M \subset N$ (the only reason to change a view is to remove a process from the set when it crashes).
* **GM2.** Uniform Agreement: No two processes install views $(j,M_1)$ and $(j,M_2)$ such that $M_1 \neq M_2$.
* **GM3.** Completeness: If a process $p$ crashes, then there is an integer $j$ such that every correct process installs view $(j,M)$ in which $p \notin M$.
* **GM4.** Accuracy: If some process installs a view $(i,M)$ and $p \notin M$, then $p$ has crashed.

## View-Synchronous Broadcast (VS)
* **VS1.** Validity = RB1
* **VS2.** No Duplication = RB2
* **VS3.** No Creation = RB3
* **VS4.** Agreement = RB4
* **VS5.** Local Monotonicity = GM1
* **VS6.** Uniform Agreement = GM2
* **VS7.** Completeness = GM3
* **VS8.** Accuracy = GM4
* **VS9.** View Inclusion: A message is `vsDelivered` in the view where it is `vsBroadcast`.

## Shared Memory (SM)
### (1,N) Regular Register
* **RR1.** Termination: If a correct process invokes an operation, then the operation eventually completes.
* **RR2.** Validity:
    * Any read not concurrent with a write returns the last value written.
    * Reads concurrent with a write return the last value written or the value concurrently being written.

### (1,N) Atomic Register
* **AR1.** Termination = RR1
* **AR2.** Validity = RR2
* **AR3.** Ordering: If a read returns a value $v$ and a subsequent read returns a value $w$, then the write of $w$ does not precede the write of $v$.