# Interior Point Methods for Solving Linear Programs

* These notes are based on my semester research project in the [Theoretical Computer Science Lab](https://theory.epfl.ch/) at EPFL, supervised by Prof. Dr. Kapralov and Kshiteej Sheth.
* Having an idea of what [Linear Programs](https://en.wikipedia.org/wiki/Linear_programming) are is recommended before reading

## 0. Motivation

Interior-Point Methods are approximation algorithms that solve linear programs. Seen as a framework, it is until now the fastest known algorithm for solving the famous [maximum-flow problem on graphs](https://en.wikipedia.org/wiki/Maximum_flow_problem), and although it has many numerical stability problems in practice, it's the current best framework for optimizing (with high accuracy) general convex functions in both theory and practice.  

These notes first present the general framework of Interior-Point Methods and how it works, and then the concept of barriers is formalized to present the Lee-Sidford barrier, which is used to achieve runtime improvements. The notes will focus on understanding the theoretical concepts of the method rather than focusing on the details of the runtime. The concepts are in my opinion super interesting and very smart!

$e^x$

## References

* Y. T. Lee, A. Sidford - [Solving Linear Programs with sqrt(rank) linear system solves](https://arxiv.org/abs/1910.08033)
* Lecture notes from the famous Yin Tat Lee: [CSE 599: Interplay between Convex Optimization and Geometry](https://yintat.com/teaching/cse599-winter18/)