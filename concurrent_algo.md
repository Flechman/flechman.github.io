# Concurrent Algorithms
* These notes are based on the EPFL CS-453 Concurrent Algorithms course given in Autumn 2022 by Prof. Guerraoui.
* [Course Website](https://dcl.epfl.ch/site/education/ca_2021)
* The course follows the book [*Algorithms for Concurrent Systems*](https://www.epflpress.org/produit/909/9782889152834/algorithms-for-concurrent-systems) by Rachid Guerraoui, Petr Kuznetsov.

# Overview
1. Introduction
2. Implementing Registers  
    2.1. Assumptions & Vocabulary  
    2.2. Binary <ins>SRSW</ins> Safe -> Binary <ins>MRSW</ins> Safe  
    2.3. Binary MRSW <ins>Safe</ins> -> Binary MRSW <ins>Regular</ins>  
    2.4. <ins>Binary</ins> MRSW Regular -> <ins>M-Valued</ins> MRSW Regular  
    2.5. M-Valued SRSW <ins>Regular</ins> -> M-Valued SRSW <ins>Atomic</ins>  
    2.6. M-Valued <ins>SRSW</ins> Atomic -> M-Valued <ins>MRSW</ins> Atomic  
    2.7. M-Valued <ins>MRSW</ins> Atomic -> M-Valued <ins>MRMW</ins> Atomic
3. The Power & Limitation of Registers
4. Universal Objects & Synchronization Number
5. Transactional Memory

# 1. Introduction  

With multicore architectures becoming the standard nowadays, we need a way to execute instructions concurrently following certain rules that make the programs execute in a coherent manner. We study here the foundations of the algorithms that enable such concurrency.

Here we assume multiple processes working on a shared memory space. The goal is to avoid any inconsistencies in the memory space while these processes execute concurrently, and for example we should be able to order the concurrent execution in a sequential manner such that the behavior of the concurrent execution is the same as that of a sequential one in terms of memory access and memory content (we call this **Linearizability**).

The most popular and easiest solution to such concurrency issues is the use of **locks**. They are objects that enable mutual exclusion of the shared memory meaning that at most 1 process can access a shared memory region at a time. The first process to acquire the lock to a certain shared region is the only one that can access this region, until this process releases the lock. In the meantime the other processes wanting to access the region wait. This can be extremely inefficient as a waiting process does not know when the lock is going to be released. Now there can be some logic put in place to mitigate this behavior, but this exposes a limitation one will have using locking in concurrent systems. Locking is efficient when concurrent processes access disjoint sets of memory, but this is often not the case in concurrent systems.  
The reason why locks are used as a first solution to concurrent execution is the following: they enforce a sequential execution of the concurrent set of instructions, thus memory manipulation is coherent. Locks synchronize the concurrent access and in fact provide an order on the instructions. But as we've discussed, this can penalize the execution time of the processes because they sometimes have to wait, and we can do better. The course thus aims at explaining how we do better. 

*TL;DR* - In this course we study how to **wait-free** implement high-level **atomic** objects out of basic objects.

* An operation (or object) is  **Atomic** if the operation (on the object) appears to execute at some indivisible point in time. 

* An operation (or object) is  **Wait-Free** if any correct process that invokes an operation (on the object) eventually (in french: "inévitablement") gets a reply.

* In the context of this course, we work with a finite set of n processes p_1, ..., p_n which are aware of eachother. Each process is sequential, and if a process crashes we assume that it does not recover. A process that does not crash is called *correct*.

* Most of the pseudocode that follows is written JAVA-like

Concurrent execution diagrams will be shown to represent situations. Here is an example below:  

![Example execution diagram](example_exec_diagram.png)
* p1, p2, p3 represent processes. 
* The horizontal lines represent the execution timeline of each process. 
* Each box represents an operation currently executing. 
* Each dot represents an indivisible point in time where the operation could happen, these dots are used when we want to see if atomicity is possible in the execution diagram, this will be explained further later.

# 2. Implementing Registers

## 2.1 Assumptions & Vocabulary
A **register** is a memory space and has two operations: *read()* and *write()*.  
We call this a R/W register.  
We assume that we work only with  integers, since any object can be built on top of integers.  
Unless explicitly stated otherwise, registers are initially supposed to contain 0.  
The sequential specification of a register is as follows:  
```java
T x = 0; // The register

T read() {
    return x;
}

void write(T v) {
    x = v;
}
```
From these two basic sequential *read()* and *write()*, we will try to build up concurrent *read()* and *write()* operations for registers that support increasingly more robust concurrency specifications.  

These concurrency specifications come in 3 dimensions:  
* Dimension 1: value range
    * Binary (boolean, single bit)
    * Multivalued (multiple bits)
* Dimension 2: access pattern
    * SRSW (Single Reader, Single Writer)
    * MRSW (Multiple Reader, Single Writer)
    * MRMW (Multiple Reader, Multiple Writer)
* Dimension 3: concurrent behavior
    * Safe
    * Regular
    * Atomic

Elements in dimensions 1 and 2 are straight-forward to understand. Elements in dimension 3 need some definition, they represent correctness guarantees of the concurrent behavior of the register.  
* **Safe** register: This only ensures that a *read* that is not concurrent with any *write* returns the last value written.  
This means that when a *read* is concurrent with a *write*, the *read* may return any value in the set of possible values. Note that such registers do not support multiple writes, this would result in an undefied behavior and there could be any value in the register (to convince yourself, think of what would happen physically in the hardware with the signal).  

* **Regular** register: A *read* that overlaps with one or more *writes* can return the value written by any of these *writes*, as well as the value of the register before these *writes*.  
This means that while overlaping with a *write*, the *read* cannot return ANY value in the set of possible values, it has to return the MOST RECENT previously written value (or the value of the concurrent *write*), which is stronger than the safe register. Note again (for the same reason) that there cannot be multiple concurrent *writes*. But there can be multiple sequential (non-overlapping) *writes* that are concurrent with the *read*.  

* **Atomic** register: If two sequential *reads* happen concurrently with one or more *writes*, the value of the second *read* must be at least as recent as the value read by the first *read*.
This means that if the first *read* reads the value of a first *write*, then the second *read* cannot read the previous value of the register, it has to read the value of the first *write* (or, say, the value of a *write* that happens sequentially later than the first *write*). This is the key difference with the Regular guarantee, which we explain in more detail below.

The key difference between Regular and Atomic is what's called *new/old inversion*: in a Regular register, we could have the following situation: if two sequential *reads* are concurrent with a *write*, the first *read* could read the value of the *write* while the second *read* reads the previous value of the register. In an Atomic register, this is not permitted, because the previous value of the register is older than the value of the write.  
The diagram below shows an example of a valid execution for a regular register, but which is an invalid execution for an atomic register (don't pay attention to the dots).  

![Example of valid regular execution but invalid atomic execution](valid_regular_invalid_atomic.png)

--

## 2.2 Binary SRSW Safe -> Binary MRSW Safe

Our basic sequential R/W register that we start from guarantees [Binary, SRSW, Safe].  
From there we will extend to obtain a R/W register that guarantees [Binary, MRSW, Safe], so we go from having a single reader to handling multiple concurrent readers.  

Our extension uses an array of SRSW registers `reg[]` of size N, where N is the number of processes. The *read()* and *write()* operations of our MRSW register are defined as follows:  
```java
boolean[] reg = new boolean[N]; // Each entry is Binary SRSW Safe

boolean read() { // Called by process i
    return reg[i].read();
}

void write(boolean v) {
    for(int i=0; i<N; ++i) {
        reg[i].write(v);
    }
}
```
Thanks to one array entry per process, no two processes acces the same SRSW register. When a *write* occurs concurrently with a *read*, either the previous value of the register is returned from the *read()* or the new value of the *write* is returned, which preserves Safety. So the [Binary, MRSW, Safe] guarantees are verified.  

Note that this transformation would also work if we go from [Multivalued, SRSW, Safe] to [Multivalued, MRSW, Safe], as well as from [Multivalued, SRSW, Regular] to [Multivalued, MRSW, Regular] (remember, we don't allow two *writes* to be concurrent).  
However, from [Multivalued, SRSW, Atomic] to [Multivalued, MRSW, Atomic] this transformation doesn't work. Think of a potential situation where it doesn't work (hint: first *read* 
with lower id than second *read*, concurrent with a *write*).

## 2.3 Binary MRSW Safe -> Binary MRSW Regular

Now we go from a register that provides [Binary, MRSW, Safe] guarantees to one that provides [Binary, MRSW, Regular] guarantees.  
To go from Safe to Regular, we need to restrict the number of possible outcomes of a *read()*, we can't have any value in the domain set. We will heavily rely on the fact that we have Binary.  
Since we work with binary, the domain set is {0, 1}, so if a *write* changes the value of the register then we can directly infer the previous value of the register since we only have two possible values, and Regularity is verified.   
Now this is when the *write* changes the value of the regiser. What about if the *write* writes the same value as the one currently in the register ? As our Safe register provides only safety, a concurrent *read* could read ANY value. In particular if the initial value is 0 and the *write* writes 0, the *read* could get 1 which violates Regularity since 1 was never a previous value in the register. Thus our transformation simply checks if the *write* will change the value or not. If it will, then we call the *write()* of our safe register, and we know that after this *write*, at some point our register will have contained 0 and 1.  
```java
boolean reg = 0; // Binary MRSW Safe

boolean read() {
    return reg.read();
}

void write(boolean v) {
    if(reg.read() != v) {
        reg.write(v);
    }
}
```

The transformation works also for SRSW.  
Since we rely on the fact that our domain set is of size 2 this doesn't work with Multivalued.  
It doesn't work for Regular to Atomic.

## 2.4 Binary MRSW Regular -> M-Valued MRSW Regular

Here we go from Binary to Multivalued MRSW Regular register.  

To do this we will use an array of [Binary, MRSW, Regular] registers and One-Hot encoding, with the interpretation that if the i'th binary value of the array is 1, then the value of the register is i. The size of the array is M+1 with M being the largest value in our domain set (for a JAVA integer, M would be `Integer.MAX_VALUE`).  

```java
boolean[] reg = new boolean[Integer.MAX_VALUE+1]; //[Binary, MRSW, Regular] registers

int read() {
    for(int j=0; j<Integer.MAX_VALUE; ++j) {
        if(reg[j].read() == 1) return j;
    }
}

void write(int v) {
    reg[v].write(1);
    for(int j=v-1; j>=0; --j) {
        reg[j].write(0);
    }
}

```
* The transformation would not work if the *write()* writes the 0s before the 1: consider the case where we have 01001 and no *writes* are currently running (it is a valid state and a *read()* would return 1). Now, a *write(2)* starts and a *read()* is concurrent with the *write*. Since we need to guarantee Regularity, the *read* should return 1 or 2. If we write the 0s before the 1 we could end-up in a situtation where the *write* removed the 1 (state 00001) and the *read* continues past the 1 and 2 to read the 4.  

* The transformation guarantees Regularity but not Atomicity: The following diagram shows an execution using the above *read()* and *write()* that violates Atomicity. The initial state of the register 10. The understanding is given as exercise.   
![Multivalue MRSW Regular but not Atomic, using Binary MRSW Regular](reg_notAtom_binToMulti.png)

* The transformation guarantees wait-freedom: as we write 1 before writing 0s, any read would always necessarily come accross a 1. This explains why we don't need a default *return* in the above *read()* definition.

* Exercise: prove Safety using the definition of Safe register.

* Regularity is guaranteed: let v0 be the most recent value in the register. Now we have a *read* concurrent with a *write* with value v1. If v1 > v0, then either the *read* returns v1 or it returns v0. It cannot return v > v1 (v1 stops the *read*), it cannot return v < v0 because when v0 was written it cleared the smaller values, and it cannot return v0 < v < v1 because if v > v0 then v0 is 0 but then from the write definition all the v0 < v < v1 have also been cleared. The case v0 > v1 is similar, with the key point being that when writing we write 1 before clearing the smaller values. That way if the *read* happens all before the *write* then v0 will be returned, else v1 will be returned. This can be generalized to multiple *writes* concurrent with the *read*.

## 2.5 M-Valued SRSW Regular -> M-Valued SRSW Atomic

We come back to a Single Read register, to first try to go from Regular to Atomic.  

The goal here is that if we have two sequential *reads* with a concurrent *write* then the second *read* should return a value at least as new as the first *read*. In other words, we prevent new/old inversion. We achieve this using a timestamp. For 1 SRSW Atomic register we use 1 SRSW Regular register that stores both the timestamp and the value (one could think for example that the timestamp is stored in the MSBs and the value in the LSBs).   
We don't use 2 registers to prevent the timestamp from being inconsistent with the value (a *write* operation to these two memory places would need 2 steps and not 1, which could be concurrent with a *read*).  

```java
int reg = 0;
int [t, x] = 0;

int read() {
    int [t2, x2] = reg.read();
    if(t2 > t) {
        t = t2;
        x = x2;
    }
    return x;
}

void write(int v) {
    t = t+1;
    reg.write([t, v]);
}
```
* `reg` is the Single Read register
* `t` is the local variable representing the timestamp, the reader and the writer have one each.
* The notation `[t, x]` is used to represent a single variable containing two values as discussed above.
* For the `write()`, remember that we have Single Writer, so no concurrency can happen in it.

This would not work for multiple readers, as `reg` is SRSW so it doesn't support multiple readers reading into it.
If we were to extend the algorithm for multiple readers by setting `reg` to be an array of N SRSW registers (one entry for each reader), this would still not work. Whenever there is a *write*, it has to iterate over each entry of `reg` to update the value at each. At this moment, a reader can read the updated value of the *write* because the *write* had time to update its entry, while some time after, another reader reads the previous value before the write because the write didn't have time to update its entry. It is at this moment that there can be a new/old inversion.

An important note here is that we don't limit the size of the timestamp, in other words we assume we have infinite capacity. This algorithm only works if we assume this, and finding algorithms that work with limited capacity is still a hot topic in Concurrent Algorithms research.

## 2.6 M-Valued SRSW Atomic -> M-Valued MRSW Atomic

Since our algorithm in the previous section failed to guarantee atomicity when we have Multiple Readers, we now give an algorithm that succeeds.  

In the algorithm, we use a N*N matrix of SRSW Atomic registers to communicate among the readers (N is the number of readers). An entry (i, j) in the matrix corresponds to when reader i reads this entry and reader j writes to this entry (as we'll see a `read()` will write in the matrix to communicate to the other readers).  
We also use N SRSW Atomic registers to store new values. The single writer will only write in these N registers.

```java
int[][] rReg = new int[N][N]; //Initially all zeros
int[] wReg = new int[N]; //Initially all zeros
int t = 0; //Local variable (timestamp) only accessible from the single writer

int read() { //Called by reader i
    for(int j=0; j<N; ++j) { //Iterate over line i
        int [t_j, x_j] = rReg[i][j].read();
    }
    int [t_w, x_w] = wReg[i].read();
    int [t_m, x_m] = max([t_w, x_w], {[t_j, x_j] for j=0 to N-1}); //Max among all timestamps
    for(int j=0; j<N; ++j) { //Iterate over column i
        rReg[j][i].write([t_m, x_m]);
    }
    return [t_m, x_m];

}

void write(int v) {
    t = t+1;
    for(int i=0; i<N; ++i) {
        wReg[i].write([v, t]);
    }
}
```
The main issue with our algorithm in the previous section for multiple readers is that, while the writer writes into the memory places of every readers (here it's identified as `wReg`), one first reader can read the updated value from this writer and then finish, and a next reader can read the previous value because the writer hasn't had the time to iterate over its memory place yet. This creates a new/old inversion because the first reader finished reading before the second reader started.  
In our new algorithm here, this cannot happen, because the first reader communicates the value it has decided to read to all the other readers (this is done when the reader writes) before finishing. That way the next reader will read the value written by the previous reader (first step of the `read()`) and it knows it has to return a value at least as recent as this one. Note: we know that the previous reader has returned when the next reader starts.  
This can (to some extent) be thought of as a consensus mechanism put in place among the readers, where they agree on the latest value read by any of them.

The algorithm doesn't work for multiple writers, because each entry of `wReg` only supports Single Writer.

## 2.7 M-Valued MRSW Atomic -> M-Valued MRMW Atomic

To create an algorithm that enables 1 register to support Multiple Writers (N of them), we'll use N registers that support MRSW. Register j is for writer j.  

```java
int[] reg = new int[N]; //N MRSW Atomic registers

int extract_max() {
    for(int j=0; j<N; ++j) {
        [t_j, x_j] = reg[j].read();
    }
    [t_m, x_m] = max({[t_j, x_j] for j=0 to N-1}) //Max among timestamps
    return [t_m, x_m];
}

int read() {
    [t_m, x_m] = extract_max();
    return x_m;
}

void write(int v) {
    [t_m, x_m] = extract_max();
    t_m = t_m + 1
    reg[i].write([t_m, v]);
}
```

Any writer w2 that writes after the most recent finished writer w1 will have at least w1's timestamp, so its new timestamp will be up to date.  
Any read r2 that reads after the most recent finished read r1 (who read t1 as latest timestamp) will read at least t1 as latest timestamp, so r2 is guaranteed to return a value at least as recent as r1, which verifies Atomicity.

# 3. The Power of Registers

What atomic objects can we implement in a wait-free manner with registers ?  
Here, we present two common (and interesting) objects that can be implemented in such a way.  

## 3.1 Counter

A counter can be read and incremented, its sequential specification is as follows:

```java
T x = 0;

T read() {
    return x;
}

void inc() {
    x = x + 1;
}
```
We now implement the counter in a concurrent context such that every operations appear to execute sequentially, without using locks. 
* We use our atomic registers implemented in the previous sections. 
* The N processes share an array of registers of size N, where register i is only modified by process i.

The idea is very simple and elegant, and it simply relies on the fact that each process increments its own counter, and when there is a read, the read will sum on all the counters.

```java
T[] reg = new T[N];

void inc() { // Called by process i
    reg[i].write(reg[i].read()+1)
}

T read() {
    T sum = 0;
    for(int i=0; i<N; ++i) {
        sum = sum + reg[i].read();
    }
    return sum;
}
```
* This implementation is wait-free, because the `read()` and `write()` operations of `reg` are wait-free, and in the read we iterate a finite number of times.
* This implementation is atomic, because the increments are isolated between processes, and the `read()` operation of the registers is atomic (thus a newer sum will always be at least as high as an older sum).


## 3.2 Snapshot

This object is more complicated to implement than the counter. A snapshot maintains an array of size M. Its sequential specification is as follows:

```java
T[] x = new T[M];

T[] scan() {
    return x;
}

void update(int i, T v) {
    x[i] = v;
}
```
So it's like a mutable array, but it can only be read/returned entirely. It is powerful that we can implement this object while supporting our concurrency specifications.  

Let's first look at a naive implementation that doesn't work. The `scan()` basically copies the array entry by entry, and the `update(i,v)` atomically updates entry i with value v (possible because register i is atomic).

```java
T[] reg = new T[M];

T[] scan() {
    T[] x;
    for(int i=0; i<M; ++i) {
        x[i] = reg[i].read();
    }
    return x;
}

void update(int i, T v) {
    reg[i].write(v);
}
```

With this implementation the following scenario is possible:  

![Snapshot naive implementation invalid scenario](snapshot_naive_invalid.png)

Atomicity is violated because we cannot linearize the execution, i.e. we cannot put a dot in the scan of p1, put a dot in the update of p2 and put a dot in the update of p3 and have the output we got. To get atomicity, we need [update of p3 read => update of p2 read].

The fact that this implementation doesn't work really shows (or defines) what our atomicity goal is. We don't just want atomicity per entry of the array. We want atomicity on the whole array. Even though `update(i,v)` acts on a single entry, its behavior must be as if it acted on the whole array (on every entries) at once.  

Now, we try to get atomicity.  
Observe that, using scan from the previous naive implementation, if we execute scan once and then we execute scan a second time and the values didn't change, then we've found an indivisible point in time where no writes happended during the time we read, i.e. we've found a linearization point. This point is between the two scans. This is a key idea to reach atomicity.  
Actually, there's a small error in what we've just said. Scanning twice and checking if no values changed doesn't mean writes didn't happen. There could have been a write that changed the value and then another write that changed back to the previous value. To really capture the fact that no writes occured, we use timestamps. Now if we check if no timestamps changed, then we have our linearization point.

```java
T[] reg = new T[M];
int ts = 0;

T[] collect() {
    T[] x;
    for(int i=0; i<M; ++i) {
        x[i] = reg[i].read();
    }
    return x;
}

T[] scan() {
    T[] t1 = collect();
    T[] t2 = collect();
    while(t1 != t2) {
        t1 = t2;
        t2 = collect();
    }
    return t1;
}

void update(int i, T v) {
    ts = ts + 1;
    reg[i].write(ts, v);
}
```
* Each entry in `reg` is of the form `[t,v]` where t is a timestamp and v is a value.
* `ts` is a local variable for each process, and `reg` is shared among processes.
* `t1 != t2` means there exists an entry i such that t1[i] != t2[i].
* `collect()` is the function that reads through and copies the entire array.  

This algorithm guarantees atomicity, but what about wait-freedom ? A process could get indefinitely stuck in `scan()` because other processes keep updating values. We have to modify the algorithm to account for this.  

To do this, the faster processes that keep updating will themselves try to `scan()`. Only if they succeed on scanning will they be able to update, and when they update they also write the scan they got to share it to other processes.  
So now each entry of the array will contain 3 elements: a timestamp, a value, and a copy of the entire array of values (to share to other processes as potential scans to use).  

To `scan()`, a process keeps collecting until two successive collects do not change, or some collect returned by another concurrent scan is valid (validity will be made clear in the algorithm pseudocode).  
To `update()`, a process scans, and then writes the value, the new timestamp, and the result of the scan.

```java
T[] reg = new T[M];
int ts = 0;

void update(int i, T v) {
    ts = ts + 1;
    T[] s = scan();
    reg[i].write(ts, v, s);
}

T[] collect() {
    T[] x;
    for(int i=0; i<M; ++i) {
        x[i] = reg[i].read();
    }
    return x;
}

T[] scan() {
    T[] t1 = collect();
    T[] t2 = t1;
    while(true) {
        T[] t3 = collect();
        if(t3 == t2) return values(t3); // Return 2nd element of each cell of t3
        for(int i=0; i<M; ++i) {
            if(t3[i][1] >= t1[i][1]+2) return t3[i][3]
        }
        t2 = t3;
    }
}
```
* Each entry in `reg` is of the form `[t,v,s]` where t is a timestamp, v is a value and s is a copy of the values of the array.
* `ts` is a local variable for each process, and `reg` is shared among processes.
* `t1 != t2` means there exists an entry i such that t1[i] != t2[i].
* `collect()` is the function that reads through and copies the entire array.  

The last thing to clarify is the `+2`. +1 would make sense, because we would take the scan of the process that made the update in-between our two collects. Call this process p. But +1 is a problem when p made its scan long before it actually updates and writes in the register. Between its scan and the time it actually updates (thus when a collect will capture the update), there could be a situation where another process updates, and p's scan didn't capture that update. This case is subtle but it would violate atomicity, and thus +2 is here to ensure this situation doesn't happen, and p's scan indeed captured all the necessary updates until itself.

The 3 key points of this algorithm are:
* The use of timestamps
* `collect`ing twice and checking if nothing changed to get a linearization point
* Sharing the scan of fast processes to prevent blocking of other slower processes

# 4. The Limitations of Registers

What objects cannot be implemented with registers if we want them to be atomic and wait-free ?  
In this section we look at the impossibility of consensus theorem, and we use this theorem to prove that some objects cannot be implemented using only registers in a concurrent context.  

## 4.1 Impossibility of Consensus

Consensus is an object that has only one function `propose(v)` which returns a value. When a value is returned we say that this value was decided. `propose` is called by each process and the specifications of consensus are as follows:
* (wait-freedom/termination) when `propose` is called, it eventually returns
* (agreement) no two processes decide differently
* (validity) any decided value has been proposed

<ins>**Theorem:**</ins> No asynchronous deterministic algorithm implements consensus among two processes using only registers.  

Asyncronous means there are no time bounds on the execution of concurrent processes.

<ins>*Proof:*</ins>  
We proceed by contradiction and assume such an algorithm A exists. Consider p0 and p1 two processes, and registers r1,...,rK.  

We first state some elements of the model
* An operation on a register can only be either a read or a write.
* A *configuration* C is a global state of the concurrent system. A state is composed of the values of p0 and p1 (at initial, the values are what they propose, and when returning, the values are what they decide), and the values of the registers.
* A *step* enables to transition from a configuration to another, it consists in reading or writing a value in a register and changing p0 or p1's state according to algorithm A. A step is executed by one process, and the configuration resulting from taking a step with process pi from C is noted as pi(C).
* A *schedule* S is a sequence of steps. S(C) denotes the configuration that results from applying the sequence of steps S to configuration C.
* An adversary decides which process executes the next step and the algorithm A deterministically decides the next configuration based on the current one. 
* Let u be 0 or 1. A configuration C is *u-valent* if, starting from C, no matter what schedule we take, no decision other than u is possible. In that case C is *univalent*.
* If starting from C, both 0 and 1 can still be decided depending on the schedule (i.e. depending on the adversary), then C is called *bivalent*.
* We will write C = C' when C and C' have the same "valence" (either bivalent, 0-valent, or 1-valent).

The proof is based on the following two lemmas:
* <ins>Lemma 1:</ins> There is at least one initial bivalent configuration.

* <ins> Lemma 2:</ins> Given a bivalent configuration C, there is an arbitrary long schedule S such that S(C) is bivalent.

So what this means is, the adversary can always start at an initial bivalent configuration, and indefinitely transition from a bivalent configuration to another bivalent configuration. Thus the algorithm never makes a decision because it never gets to a univalent configuration, and it violates wait-freedom. We indeed have our contradiction, which concludes the proof.  

We now (informally) prove the lemmas, which give good intuition as to why consensus is not possible using only registers.

* Lemma 1: the initial configuration C(0,1) is bivalent. C(0, 1) means that p0 proposes 0 and p1 proposes 1.  
We show that the decision is dependent on the adverary's schedule, meaning that with adversary's schedule S, 0 could be decided, and with adversary's schedule S', 1 could be decided. Let's say that for S the adversary kills p1. Then p0 cannot know what p1 proposed and sees that p1 was killed. By the validity property of consensus, p0 will decide 0. Let's say now for S' that the adversary kills p0. Same story here, p1 will decide 1. Thus with this initial configuration 0 or 1 could still be decided and so it is not univalent.  
*(On the other hand, convince yourself that C(0,0) is univalent)*

* Lemma 2: we have C is bivalent. Let's say towards contradiction that there are no *arbitrary long* schedule S such that S(C) is bivalent. Then, there is a schedule S with maximum length such that D=S(C) is bivalent, and any S'(D) is univalent.  
Let's see what can happen after D.
    1. Either p0 executes a step and p0(D) is 0-valent, or p1 executes a step and p1(D) is 1-valent (the case [p0, 1-valent] and [p1, 0-valent] is similar). It cannot be that p0(D) is u-valent p1(D) is also u-valent because otherwise it would mean that D is u-valent (thus univalent).    
    1. We claim that from D, when p0 executes a step and p1 executes a step, they both access the same register. If they don't, then we would have p0(p1(D)) = p1(p0(D)) because they work on different parts of memory. But this is impossible because we said that p0(D) is 0-valent and p1(D) is 1-valent, meaning that p1(p0(D)) would be 0-valent and p0(p1(D)) would be 1-valent because decision is made when having univalence. So p0 and p1 access the same register, and the order of execution (either p0 first or p1 first) is critical.  
    1. Now, we claim that the step of p0 or p1 cannot be a read. If it is a read, then, since a read doesn't modify the register values, it doesn't change the configuration, and p0(D) = D or p1(D) = D, which contradicts what we said D was (D is the "last" bivalent configuration). So p0 and p1 can only do a write.  
    1. Finally, we claim that the step of p0 and p1 cannot be a write either. If they write, then, since p0 and p1 work on the same register, depending on the order of the write and using the fact that our register is wait-free and atomic, p0 and p1 will overwrite each other. Thus p0(p1(D)) = p0(D), and p1(p0(D)) = p1(D). Since p1(D) is 1-valent, p0(p1(D)) should be 1-valent, but p0(D) is 0-valent => contradiction. The other case is similar.  
    5. Since we can only read or write on a register, we cannot "move from D" and reach univalance. This means that our algorithm A would never decide, which is a contradiction. This concludes the proof of lemma 2.

This shows that the register object is too weak for consensus, read and write is not enought. In some sense we would need something more than just read and write to be able to implement consensus.  

In what follows, we present some objects that cannot be implemented in our concurrent context using only registers.   
The way we prove that they cannot be implemented using only registers is by proving that we can implement consensus using these objects. This makes sense, because if we can implement consensus using these objects and consensus cannot be implemented using only registers, then these objects cannot be implemented using only registers.

## 4.2 Fetch&Inc

The Fetch & Increment object is a counter that contains an integer. It has one operation, `fetch&inc()`, which increments the counter by 1 and returns the new value of the counter. 
Its sequential specification is as follows

```java
int c = 0;

int fetch&inc() {
    c = c + 1;
    return c;
}
```
We now present an algorithm for Consensus that uses two registers r0 and r1, and a Fetch&Inc object C.  
`propose` is called by each process (p0 and p1), and pi writes in register ri.

```java
FetchInc c = new FetchInc();
int r0 = 0;
int r1 = 0;

int propose(int v) { // Called by process pi
    if(pi == p0) r0.write(v);
    if(pi == p1) r1.write(v);
    int val = c.fetch&inc();
    if(val == 1) return v;
    else {
        if(pi == p0) return r1.read();
        if(pi == p1) return r0.read();
    }
}
```

Since Consensus cannot be implemented using only registers, and by the fact that we've built an algorithm that implements Consensus using only registers and Fetch&Inc, we have that Fetch&Inc cannot be implemented using only registers.

## 4.3 Queue

The Queue is an object containter with two operations: `enq()` and `deq()`. It is a FIFO data structure that you can learn about on internet. Can we implement an atomic wait-free Queue using only registers ? No, because we can implement Consensus using a Queue and registers.  
The algorithm is as follows: it uses two regisers r0 and r1, and a Queue q initialized to {"winner", "loser"}.

```java
Queue<String> q = new Queue({"winner", "loser"});
int r0 = 0;
int r1 = 0;

int propose(int v) { // Called by process pi
    if(pi == p0) r0.write(v);
    if(pi == p1) r1.write(v);
    String item = q.deq();
    if(item == "winner") return v;
    else {
        if(pi == p0) return r1.read();
        if(pi == p1) return r0.read();
    }
}
```

## 4.4 Test&Set

A Test & Set object maintains a binary value x initialized to 0. It provides one operation `test&set()`, which basically sets x to 1, and returns the previous value of x. Once x is set to 1, the operation doesn't have anymore impact. This object is useful for example when processes race. x can be viewed as a key, and once it is taken, it is taken forever.  
The sequential specification is as follows:

```java
boolean x = 0;

boolean test&set() {
    boolean y = x;
    x = 1;
    return y;
}
```

Test&Set cannot be implemented in an atomic and wait-free manner using only registers, because we can implement Consenus using Test&Set and registers.  
The algorithm is as follows: it uses registers r0 and r1, and a Test&Set object t.

```java
TestSet t = new TestSet();
int r0 = 0;
int r1 = 0;

int propose(int v) { // Called by process pi
    if(pi == p0) r0.write(v);
    if(pi == p1) r1.write(v);
    int val = t.test&set();
    if(val == 0) return v;
    else {
        if(pi == p0) return r1.read();
        if(pi == p1) return r0.read();
    }
}
```

## 4.5 Compare&Swap

The Compare & Swap object maintains a value x, initialized to `null`. It provides one operation `compare&swap(old,new)`. The operation compares x with `old`, and if they are equal assigns value `new` to x. If they are not equal the operation doesn't do anything. The operation returns the new value if x and `old` we equal, and it returns x otherwise.  
The sequential specification is as follows:

```java
T x = null;

T compare&swap(T old_v, T new_v) {
    if(x == old_v) x = new_v;
    return x;
}
```

Compare&Swap cannot be implemented in an atomic and wait-free manner using only registers, because we can implement Consenus using Compare&Swap and registers.  
The algorithm is as follows: it uses a Compare&Swap object c.

```java
CompareSwap c = new CompareSwap();

int propose(int v) { // Called by pi
    Integer val = c.compare&swap(null, v);
    if(val == v) return v;
    else return val;
}
```