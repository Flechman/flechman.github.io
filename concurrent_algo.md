# Concurrent Algorithms
* These notes are based on the EPFL CS-453 Concurrent Algorithms course given in Autumn 2022 by Prof. Guerraoui.
* [Course Website](https://dcl.epfl.ch/site/education/ca_2021)
* The course follows the book [*Algorithms for Concurrent Systems*](https://www.epflpress.org/produit/909/9782889152834/algorithms-for-concurrent-systems) by Rachid Guerraoui, Petr Kuznetsov.

## Overview
1. Introduction
2. Implementing Registers  
    2.1 Assumptions & Vocabulary  
    2.2 Binary <ins>SRSW</ins> Safe -> Binary <ins>MRSW</ins> Safe  
    2.3 Binary MRSW <ins>Safe</ins> -> Binary MRSW <ins>Regular</ins>  
    2.4 <ins>Binary</ins> MRSW Regular -> <ins>M-Valued</ins> MRSW Regular  
    2.5 M-Valued SRSW <ins>Regular</ins> -> M-Valued SRSW <ins>Atomic</ins>  
    2.6 M-Valued <ins>SRSW</ins> Atomic -> M-Valued <ins>MRSW</ins> Atomic  
    2.7 M-Valued <ins>MRSW</ins> Atomic -> M-Valued <ins>MRMW</ins> Atomic
3. The Power & Limitation of Registers
4. Universal Objects & Synchronization Number
5. Transactional Memory

## 1. Introduction  

With multicore architectures becoming the standard nowadays, we need a way to execute instructions concurrently following certain rules that make the programs execute in a coherent manner. We study here the foundations of the algorithms that enable such concurrency.

Here we assume multiple processes (or threads) working on a shared memory space. The goal is to avoid any inconsistencies in the memory space while these processes execute concurrently, and for example we should be able to order the concurrent execution in a sequential manner such that the behavior of the concurrent execution is the same as that of a sequential one in terms of memory access and memory content (we call this **Linearizability**).

The most popular and easiest solution to such concurrency issues is the use of **locks**. They are objects that enable mutual exclusion of the shared memory meaning that at most 1 process can access a shared memory region at a time. The first process to acquire the lock to a certain shared region is the only one that can access this region, until this process releases the lock. In the meantime the other processes wanting to access the region wait. This can be extremely inefficient as a waiting process does not know when the lock is going to be released. Now there can be some logic put in place to mitigate this behavior, but this exposes a limitation one will have using locking in concurrent systems. Locking is efficient when concurrent processes access disjoint sets of memory, but this is often not the case in concurrent systems.  
The reason why locks are used as a first solution to concurrent execution is the following: they enforce a sequential execution of the concurrent set of instructions, thus memory manipulation is coherent. Locks synchronize the concurrent access and in fact provide an order on the instructions. But as we've discussed, this can penalize the execution time of the processes because they sometimes have to wait, and we can do better. The course thus aims at explaining how we do better. 

*TL;DR* - In this course we study how to **wait-free** implement high-level **atomic** objects out of basic objects.

* An operation (or object) is  **Atomic** if the operation (on the object) appears to execute at some indivisible point in time. 

* An operation (or object) is  **Wait-Free** if any correct process that invokes an operation (on the object) eventually (in french: "inévitablement") gets a reply.

* In the context of this course, we work with a finite set of n processes p_1, ..., p_n which are aware of eachother. Each process is sequential, and if a process crashes we assume that it does not recover. A process that does not crash is called *correct*.

* Most of the pseudocode that follows is written in JAVA

Concurrent execution diagrams will be shown to represent situations. Here is an example below:  

![Example execution diagram](example_exec_diagram.png)
* p1, p2, p3 represent processes. 
* The horizontal lines represent the execution timeline of each process. 
* Each box represents an operation currently executing. 
* Each dot represents an indivisible point in time where the operation could happen, these dots are used when we want to see if atomicity is possible in the execution diagram, this will be explained further later.

## 2. Implementing Registers

### 2.1 Assumptions & Vocabulary
A **register** is a memory space and has two operations: *read()* and *write()*.  
We call this a R/W register.  
We assume that we work only with  integers, since any object can be built on top of integers.  
Unless explicitly stated otherwise, registers are initially supposed to contain 0.  
The sequential specification of a register is as follows:  
```java
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

* **Regular** register: A *read* that overlaps with one or more *writes* cans return the value written by any of these *writes*, as well as the value of the register before these *writes*.  
This means that while overlaping with a *write*, the *read* cannot return ANY value in the set of possible values, it has to return the MOST RECENT previously written value (or the value of the concurrent *write*), which is stronger than the safe register. Note again (for the same reason) that there cannot be multiple concurrent *writes*. But there can be multiple sequential (non-overlapping) *writes* that are concurrent with the *read*.  

* **Atomic** register: If two sequential *reads* happen concurrently with one or more *writes*, the value of the second *read* must be at least as recent as the value read by the first *read*.
This means that if the first *read* reads the value of a first *write*, then the second *read* cannot read the previous value of the register, it has to read the value of the first *write* (or, say, the value of a *write* that happens sequentially later than the first *write*). This is the key difference with the Regular guarantee, which we explain in more detail below.

The key difference between Regular and Atomic is what's called *new/old inversion*: in a Regular register, we could have the following situation: if two sequential *reads* are concurrent with a *write*, the first *read* could read the value of the *write* while the second *read* reads the previous value of the register. In an Atomic register, this is not permitted, because the previous value of the register is older than the value of the write.  
The diagram below shows an example of a valid execution for a regular register, but which is an invalid execution for an atomic register (don't pay attention to the dots).  

![Example of valid regular execution but invalid atomic execution](valid_regular_invalid_atomic.png)

--

### 2.2 Binary SRSW Safe -> Binary MRSW Safe

Our basic sequential R/W register that we start from guarantees [Binary, SRSW, Safe].  
From there we will extend to obtain a R/W register that guarantees [Binary, MRSW, Safe], so we go from having a single reader to handling multiple concurrent readers.  

Our extension uses an array of SRSW registers `reg[]` of size N, where N is the number of processes. The *read()* and *write()* operations of our MRSW register are defined as follows:  
```java
boolean[] reg = new boolean[N];

boolean read() {
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

### 2.3 Binary MRSW Safe -> Binary MRSW Regular

Now we go from a register that provides [Binary, MRSW, Safe] guarantees to one that provides [Binary, MRSW, Regular] guarantees.  
To go from Safe to Regular, we need to restrict the number of possible outcomes of a *read()*, we can't have any value in the domain set.  
But since we work with binary, the domain set is {0, 1}, so if a *write* changes the value of the register then we can directly infer the previous value of the register since we only have two possible values.  
Now this is when the *write* changes the value of the regiser. What about if the *write* writes the same value as the one currently in the register ? 

## 31/10/22

- You can't do everything with R/W memory (concurrency-wise) => NOT UNIVERSAL
- Ex: Strong Counters, qeues...
- Manufacturers (Intel etc...) need to add objects to achieve UNIVERSALITY (can build anything with R/W registers and these objects)
- These objects are called 'universal objects'
- Some such objects that we'll see: Compare&Swap, Test&Set
- Test&Set is universal only in a system of 2 processes
- Compare&Swap is universal in a system of any number of processes (strong universal)
- 