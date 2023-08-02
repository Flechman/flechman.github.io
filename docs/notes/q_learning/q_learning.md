# Reinforcement Learning: Q-Learning \& Deep Q-Learning
* These notes present a [Reinforcement Learning](https://en.wikipedia.org/wiki/Reinforcement_learning) algorithm, namely 
Q-Learning
* Having a Probability, Stochastics and Machine Learning foundation is recommended before reading.
* You do not need to be familiar with Dynamic Programming in the context of Reinforcement Learning.

## Introduction

The goal of Q-Learning is to learn a certain measure of quality of actions given states. 

## Framework

- We have an agent and an environment which interact with each-other in discrete time steps. At time $t$, the agent observes the environment's state $s_t \in \mathcal{S}$, and performs action $a_t \in \mathcal{A}(s_t)$. The agent gets a reward $r_t\in \mathbb{R}$ from performing this action, and the environement changes to state $s_{t+1} \in \mathcal{S}$.
- The state transition follows a distribution $p(s_{t+1}\mid s_t, a_t)$ $\;\forall s_{t+1}\in \mathcal{S}$, and we assume to have the markov property $p(s_{t+1}\mid s_0, a_0, ..., s_t, a_t) = p(s_{t+1}\mid s_t, a_t)$.
- We assume that we don't know the environment's dynamics (model free), so we don't know the state transition $p(s_{t+1}\mid s_t, a_t)$ $\;\forall s_{t+1}\in \mathcal{S}$. In other words, from $s_t, a_t$ we cannot infer anything on $s_{t+1}$.  
- We note $\mathcal{S}$ the observable state space, $\mathcal{A}$ the action space. $\mathcal{A}(s)$ is the action space when the state of the environment is $s$, and $\mathcal{A}(s) \subseteq \mathcal{A}$. 
- $R: \mathcal{S} \times \mathcal{A} \rightarrow \mathbb{R}$ is the reward function, and $r_t = R(s_t, a_t)$. Usually the notation $r_t$ will be used to denote a random variable that depends on the event $(s_t, a_t)$.
- We define a policy $\pi$ to be a strategy for the agent. We model it as a function $\pi: \mathcal{A}\times\mathcal{S} \rightarrow [0,1]$ such that for every $s\in\mathcal{S}$, $\sum_{a\in\mathcal{A}(s)} = 1$, so that it defines, for every choice of $s\in\mathcal{S}$ a probability distribution over $\mathcal{A}(s)$, and we denote it with $\pi(a\mid s)$. 
- The notation $\mathbb{E}_{\pi}[...]$ means that we sample all actions according to $\pi$, and all states are sampled according to state transition.

Let's start with what we want to achieve. From a state $s$, we want to maximize the expected cumulative reward of our course of action. The expected cumulative reward is what we should obtain on average if we start at a state $s$ and follow our policy to perform actions. The expected cumulative reward is defined as $\mathbb{E}\left[\sum_{i=0}^{\infty}{r_{t+i}} \mid s_t=s\right]$ so our goal is:
$$\max_{\pi}\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{r_{t+i}} \mid s_t=s\right]$$

But summing infinitely many rewards can be infinite. So we slightly change our goal to circumvent this. We prioritize the impact of the most recent rewards over the ones that come later, by introducting a discount factor $\gamma\in ]0, 1[$. We thus define the discounted cumulative reward as being $G_t = r_t + \gamma r_{t+1} + \gamma^2 r_{r+2} + ... = \sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}}$.
The closer $\gamma$ is to 1, the more importance we give to long-term rewards, whereas when $\gamma$ is close to 0, we prioritize short-term rewards. This can be important if for example we are in a game where there are multiple short-term goals that don't end the game but a single long-term goal that ends the game.  

We can now define the expected discounted cumulative reward when we start at state $s$ and follow policy $\pi$, otherwise known as the State-Value Function (V-function):
 $$V^{\pi}(s) = \mathbb{E}_{\pi}[G_t \mid s_t = s] = \mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s\right]$$   
And finally we can state our ultimate goal:
$$\max_{\pi}V^{\pi}(s) \quad\forall s\in\mathcal{S} \tag{1}$$

But, sticking to our assumptions, the V-function is not sufficient. Let's say we want to use the V-function to choose an action based on $s_t$. Then we would choose the action that maximizes the next state's V-function, taking into account the reward obtained from this transition. We would want something similar to 
$$\arg \max_{a_t\in\mathcal{A}(s_t)} R(s_t, a_t) + \gamma\mathbb{E}_{p(s_{t+1}\mid s_t, a_t)}[V^{\pi}(s_{t+1})]$$


The fact that we need to get the next state distribution (i.e. information on the state transition) goes in conflict with our model-free assumption, so the V-function cannot directly be used as a means to choose an action based on the state $s_t$ we're in.  


Let's introduce a new function, called the Action-Value Function (or Q-function), which is similar to the State-Value Function but takes into account the action that has been chosen. 
$$Q^{\pi}(s,a) = \mathbb{E}_{\pi}[G_t \mid s_t = s, a_t=a] = \mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s,a_t=a\right]$$
The intuition of this function is that it gives a measure of the quality of the action we take at a certain state.

Let's link the Q-function to the V-function.

$$\begin{alignat*}{4}
Q^{\pi}(s,a) &= \mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s,a_t=a\right]\\
&= \sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s,a_t=a,s_{t+1}=s'\right]}\\
&= \sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\left(R(s_t,a_t)+\gamma\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_{t+1}=s'\right]\right)}\\
&= R(s_t,a_t) + \gamma\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_{t+1}=s'\right]}
\end{alignat*}$$

$$\Rightarrow \quad Q^{\pi}(s,a) = R(s,a) + \gamma\sum_{s'\in\mathcal{S}}{p(s'\mid s,a)V^{\pi}(s')} \tag{$*$}$$

And the other way around is obtained by summing the conditional expectations on $a_t$:

$$\begin{alignat*}{2}
V^{\pi}(s) &= \mathbb{E}_{\pi}[G_t \mid s_t = s]\\
&= \sum_{a\in \mathcal{A}(s_t)}{\pi(a_t=a\mid s_t=s)\mathbb{E}_{\pi}[G_t \mid s_t = s,a_t=a]}
\end{alignat*}$$

$$\Rightarrow \quad V^{\pi}(s) = \sum_{a\in \mathcal{A}(s)}{\pi(a\mid s)}Q^{\pi}(s,a)\tag{$**$}$$
The above equation is important. It describes the relationship between two fundamental value functions in Reinforcement Learning. It is valid for any policy. Let's see if we can simplify it when we use the optimal policy $\pi^{*}$.

Let's define what an optimal policy is by first defining a partial ordering between policies:  
Let $\pi_1$, $\pi_2$ be two policies. Then,
$$\pi_1 \geq \pi_2 \quad\Leftrightarrow \quad\forall s\in\mathcal{S}\;\;V^{\pi_1}(s) \geq V^{\pi_2}(s)$$
Some policies might not be comparable, for example if there exists $s_1, s_2$ in $\mathcal{S}$ such that $V^{\pi_1}(s_1) > V^{\pi_2}(s_1)$ but $V^{\pi_1}(s_2) < V^{\pi_2}(s_2)$.  
An optimal policy $\pi^*$ is one that is comparable with any other policy $\pi$, and such that $\pi^* \geq \pi$.

A result that we won't prove here but that we'll be using is that in our setting $\pi^*$ always exists, moreover there alway exists a deterministic policy that is optimal. Also note that there can be multiple optimal policies that give the same optimal value, i.e. $\pi^*$ may not be unique.  

We can rewrite our ultimate goal (1) as being $V^*(s) = V^{\pi^*}(s) = \max_{\pi}V^{\pi}(s)$. It is the optimal State-Value Function.  
Similarly, the optimal Action-Value Function is $Q^*(s,a) = Q^{\pi^*}(s,a) = \max_{\pi}Q^{\pi}(s,a)$.  

We will now derive an important result, which says that to obtain the values of the optimal V-function, we can concentrate on getting the values of the optimal Q-function. To help derive this important result, we first give the following lemma.

Lemma (policy improvement): If $\exists \bar{s}\in\mathcal{S}$ such that $V^{\pi}(\bar{s}) < \max_{a\in\mathcal{A}(\bar{s})}{Q^{\pi}(\bar{s},a)}$, then 
$$\exists \pi' \;s.t.\quad V^{\pi}(s) = V^{\pi'}(s) \;\;\forall s\in\mathcal{S}\setminus\{\bar{s}\} \quad\text{and}\quad V^{\pi}(\bar{s})<V^{\pi'}(\bar{s})$$

Proof:  
Let $\bar{a} = \arg\max_{a\in\mathcal{A}(\bar{s})}{Q^{\pi}(\bar{s},a)}$.  
Let $\pi'(a\mid s) = \begin{cases}\pi(a\mid s), & \text{if}\ s\neq\bar{s} \\1, & \text{if}\ s=\bar{s} \text{ and } a=\bar{a} \\0, & \text{otherwise}\end{cases}$  

* $\forall s\in\mathcal{S}\setminus\{\bar{s}\}: V^{\pi}(s)=V^{\pi'}(s)$ because $s\neq\bar{s}$ so $\pi'(a\mid s) = \pi(a\mid s)$.
* If $s=\bar{s}$, $V^{\pi}(\bar{s}) = \sum_{a\in\mathcal{A}(\bar{s})}{\pi(a\mid\bar{s})Q^{\pi}(\bar{s},a)} < \sum_{a\in\mathcal{A}(\bar{s})}{\pi'(a\mid\bar{s})Q^{\pi}(\bar{s},a)}$  
because (lemma assumption) $$\sum_{a\in\mathcal{A}(\bar{s})}{\pi(a\mid\bar{s})Q^{\pi}(\bar{s},a)} = Q^{\pi}(\bar{s},\bar{a}) = \max_{a\in\mathcal{A}(\bar{s})}{Q^{\pi}}(\bar{s},a) > V^{\pi}(\bar{s})$$  
Without loss of generality, let $t$ be the current timestep.  
Let $Q^{\pi}(s_t,a_t)$ be the random variable associated with the Q-value depending on state $s_t$ and action $a_t$, following policy $\pi$ onwards.  
Let $V^{\pi}(s_t)$ be the random variable associated with the V-function value depending on state $s_t$, following policy $\pi$ onwards.  
In what follows, we use multiple times the links derived between the Q-function and the V-function.  
$$\begin{alignat*}{7}
    V^{\pi}(\bar{s}) &< \sum_{a_t\in\mathcal{A}(\bar{s})}{\pi'(a_t\mid \bar{s})Q^{\pi}(\bar{s},a_t)}\\
    &= \mathbb{E}_{\pi'}[Q^{\pi}(s_t,a_t) \mid s_t=\bar{s}]\\
    &=\mathbb{E}_{\pi'}[r_t + \gamma\mathbb{E}_{p}[V^{\pi}(s_{t+1})] \mid s_t=\bar{s}]\\
    &=\mathbb{E}_{\pi'}[r_t + \gamma V^{\pi}(s_{t+1}) \mid s_t=\bar{s}] \quad\text{following our notation}\\
    &\leq \mathbb{E}_{\pi'}[r_t + \gamma Q^{\pi}(s_{t+1}, a_{t+1}) \mid s_t=\bar{s}]\\
\end{alignat*}$$  
The last inequality is obtained with the fact that $V^{\pi}(s_{t+1}) = \mathbb{E}_{\pi}[Q^{\pi}(s_{t+1}, a_{t+1})]$, and if $s_{t+1}\neq \bar{s}$ then $\mathbb{E}_{\pi}[Q^{\pi}(s_{t+1}, a_{t+1})]=\mathbb{E}_{\pi'}[Q^{\pi}(s_{t+1}, a_{t+1})]$, but if $s_{t+1} = \bar{s}$ then $\mathbb{E}_{\pi}[Q^{\pi}(s_{t+1}, a_{t+1})]\leq \max_{a\in\mathcal{A(s_{t+1})}}{Q^{\pi}(s_{t+1}, a)} = \mathbb{E}_{\pi'}[Q^{\pi}(s_{t+1}, a_{t+1})]$. Thus $V^{\pi}(s_{t+1}) \leq \mathbb{E}_{\pi'}[Q^{\pi}(s_{t+1}, a_{t+1})]$. Then the expectation is redundant so we can remove it.  
Repeating the above reasonning we obtain 
$$\begin{alignat*}{7}
    \mathbb{E}_{\pi'}[r_t + \gamma V^{\pi}(s_{t+1}) \mid s_t=\bar{s}] &\leq \mathbb{E}_{\pi'}[r_t + \gamma Q^{\pi}(s_{t+1}, a_{t+1}) \mid s_t=\bar{s}]\\
    &= \mathbb{E}_{\pi'}[r_t + \gamma r_{t+1} + \gamma^2 V^{\pi}(s_{t+2}) \mid s_t=\bar{s}]\\
    &\leq \mathbb{E}_{\pi'}[r_t + \gamma r_{t+1} + \gamma^2 Q^{\pi}(s_{t+2},a_{t+2}) \mid s_t=\bar{s}]\\
    &\;\;\vdots\\
    &\leq \mathbb{E}_{\pi'}[G_t \mid s_t=\bar{s}]\\
    &= V^{\pi'}(\bar{s})
\end{alignat*}$$  
So finally
$$V^{\pi}(\bar{s}) < V^{\pi'}(\bar{s})$$

Now we are ready to state our important result:

$$\forall s\in\mathcal{S}, \quad V^*(s) = \max_{a\in\mathcal{A}(s)}Q^*(s,a)$$

Proof:
* Since $(**)$ is valid for any policy, it is valid for an optimal policy. So $V^*(s) = \sum_{a\in\mathcal{A}(s)}{\pi^*(a\mid s)Q^*(s,a)}$. Let $\bar{a}=\arg\max_{a\in\mathcal{A}(s)}Q^*(s,a)$. Then $\sum_{a\in\mathcal{A}(s)}{\pi^*(a\mid s)Q^*(s,a)} \leq \sum_{a\in\mathcal{A}(s)}{\pi^*(a\mid s)Q^*(s,\bar{a})} = Q^*(s,\bar{a}) = \max_{a\in\mathcal{A}(s)}Q^*(s,a)$. Thus $V^*(s) \leq \max_{a\in\mathcal{A}(s)}Q^*(s,a)$.
* We now prove that $V^*(s) \geq \max_{a\in\mathcal{A}(s)}Q^*(s,a) \; \forall s\in\mathcal{S}$ by contradiction. So assume that $\exists \bar{s}\in\mathcal{S}: \;V^*(\bar{s}) < \max_{a\in\mathcal{A}(\bar{s})}Q^*(\bar{s},a)$.  
By our previous lemma, this means that there exists $\pi'$ such that $V^*(\bar{s})<V^{\pi'}(\bar{s})$, which means $\pi^*$ is not optimal $\Rightarrow$ Contradiction.

This is extremely useful, because we can concentrate on computing the optimal Q-values to obtain the optimal V-function values, which is exactly our ultimate goal (1). So computing the optimal Q-values comes back to achieving our goal.  
The whole idea of Q-Learning is learning these optimal Q-values. To put in place our learning framework, we first derive a recursive formula for the optimal Q-function, called the Bellman optimality equation.

Bellman optimality equation for $Q^*$:
$$Q^*(s,a) = R(s,a) +\gamma\sum_{s'\in\mathcal{S}}{p(s'\mid s,a)\max_{a'\in\mathcal{A}(s')}}Q^*(s',a')$$
This is obtained by noting that $(*)$ works in particular with $\pi^*$, and by combining it with $V^*(s)=\max_{a\in\mathcal{A}(s)}Q^*(s,a)$.  

Let $\tilde{Q}$ be the function obtained from learning $Q^*$.  
The Bellman optimality equation will help us learn $Q^*(s,a)$ for all $s\in\mathcal{S}, a\in\mathcal{A}(s)$ because our learning objective is minimizing the following error measure:

$$B(s_t,a_t,s_{t+1}) = \tilde{Q}(s_t,a_t) \;-\; \underbrace{(R(s_t,a_t) + \gamma\max_{a\in\mathcal{A}(s_{t+1})}\tilde{Q}(s_{t+1},a))}_{\text{Computed once we can observe}\ s_{t+1}}$$
It is the Bellman error, which is simply the difference between the current Q-value when we're at $s_t$ and about to take $a_t$, and the Q-value computed once we observe the next state $s_{t+1}$. Intuitively, the Bellman error is the update to our expected reward when we observe $s_{t+1}$. The part underlined is the RHS of the Bellman optimality equation, but knowing $s'=s_{t+1}$.  

Q-Learning is an algorithm that repeatedly adjusts $\tilde{Q}$ to minimize the Bellman error. At timestep $t+1$, we sample the tuple $(s_t, a_t, s_{t+1})$ and adjust $\tilde{Q}$ as follows:
$$\tilde{Q}(s_t,a_t) \leftarrow \tilde{Q}(s_t,a_t) - \alpha_t B(s_t,a_t,s_{t+1})$$
Where $\alpha_t$ is a learning rate. In practice $\alpha_t$ will be close to 0.  
Now we state the theoretical constraints under which Q-Learning converges, but we do not give the proof as 

WRITE HERE

Currently, the agent chooses an action to satisfy the equation $V^*(s) = \max_{a\in\mathcal{A}(s)}Q^*(s,a)$, so it always chooses $\arg\max_{a\in\mathcal{A}(s)}Q^*(s,a)$. Formally, the policy the agent follows is
$$\pi(a\mid s) = \begin{cases}
      1, & \text{if}\ a=\arg\max_{a'\in\mathcal{A}(s)}Q^*(s,a') \\
      0, & \text{otherwise}
    \end{cases}$$
By identifying the Bellman optimality equation with the Bellman equation in Appendix, we can conclude that this is in fact an optimal policy.

Note that Q-Learning only learns about the states and actions it visits. When our agent chooses actions, it might never go into certain states, and thus it misses some information that would help get closer to $Q^*$. This is the exploration-exploitation tradeoff: the agent should sometimes choose suboptimal actions in order to visit new states and actions.  
This tradeoff is handled by changing the greedy policy into an $\epsilon$-greedy policy. The idea is that with probability $1-\epsilon$ we apply our greedy policy, and with probability $\epsilon$ we choose an action uniformly at random. Formally, this gives the following policy:
$$
\pi(a\mid s) = \begin{cases}
      (1-\epsilon) + \epsilon\frac{1}{\mid \mathcal{A}(s)\mid}, & \text{if}\ a=\arg\max_{a'\in\mathcal{A}(s)}Q^*(s,a') \\
      \epsilon\frac{1}{\mid \mathcal{A}(s)\mid}, & \text{otherwise}
    \end{cases}
$$
Typically, $\epsilon$ changes as we go through training. It starts with a value close to 1 to favor exploration at the beginning, and decreases to be close to 0 as $\tilde{Q}$ converges to $Q^*$.

Tabluar Q-Learning: We store the Q-function in a table and do a lookup when accessing the Q-Values. There is 1 Q-Value to learn per $(s,a)$ tuple, so the number of Q-Values to learn can go up to $\mathcal{S}\times\mathcal{A}$. In practice, $\lvert \mathcal{S} \rvert$ is exponentially big, so having to store all the Q-values in a table is impractical. It would be better to have a limited-size parameterized function that approximates the Q-function.  
Deep Q-Learning: Have a neural network approximate the Q-function. As input, a representation of $(s,a)$, as output, a Q-Value.



---
Now, we want to choose actions that put the agent in a state where the expected (discounted) reward is the highest possible. The State-Value function gives you the expected discounted reward when the agent is in a specific state. It gives an appreciation of the state the agent is in. Q-Learning aims at choosing states that maximize this value. But to choose a state, we need to perform an action. In math language, if we're in $s_t$ and $s_{t+1}$ gives a good expected (discounted) reward, we need to choose the appropriate $a_t$ that gets the agent to $s_{t+1}$. We can't aim at a certain $s_{t+1}$, because we don't have access to it even when choosing action $a_t$ (model-free assumption). This is where the Q-function comes into place, which uses only $s_t$ and $a_t$, and directly links to the State-value function (which is our target of maximization). Intuitively, the Q-function gives measure of the quality of an action. We'll see that from $s_t$, choosing the action that gives the highest value in the Q-function, in math terms choosing $\arg\max_a Q(s_t, a)$ results in choosing $s_{t+1}$ that gives the highest $V(s_{t+1})$ for $t+1$.

---
We can also derive the Bellman equation of the Q-Function:
$$\begin{alignat*}{6}
Q^{\pi}(s,a) &= \mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s,a_t=a\right]\\
&= \sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s,a_t=a,s_{t+1}=s'\right]}\\
&= \sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\left(R(s_t,a_t)+\gamma\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_{t+1}=s'\right]\right)}\\
&= R(s_t,a_t) + \sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\gamma\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_{t+1}=s'\right]}\\
&= R(s_t,a_t) + \gamma\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\sum_{a'\in\mathcal{A(s_{t+1})}}{\pi(a_{t+1}=a'\mid s_{t+1}=s')\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_{t+1}=s',a_{t+1}=a'\right]}}\\
&= R(s_t,a_t) + \gamma\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\sum_{a'\in\mathcal{A(s_{t+1})}}{\pi(a_{t+1}=a'\mid s_{t+1}=s')Q^{\pi}(s',a')}}
\end{alignat*}$$

$$\Rightarrow \quad Q^{\pi}(s,a)= R(s,a)+\gamma\sum_{s'\in\mathcal{S}}{p(s'\mid s,a)\sum_{a'\in\mathcal{A}(s')}{\pi(a'|s')Q^{\pi}(s',a')}}$$


---
Let's first rewrite the V-function in a recusive manner, which is called the Bellman equation of the State-Value Function: 
$$\begin{alignat*}{7}
    V^{\pi}(s) &= \mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}}\mid s_t=s\right] \quad\quad \text{Note that $r_{t+i}$ is a random variable.}\\
    &= \mathbb{E}_{\pi}\left[r_t + \gamma\sum_{i=1}^{\infty}{\gamma^{i-1}r_{t+i}}\mid s_t=s\right]\\
    &= \mathbb{E}_{\pi}\left[r_t + \gamma\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}}\mid s_t=s\right]\\
    &= \sum_{a\in\mathcal{A(s_t)}}{\pi(a_t=a\mid s_t=s)\mathbb{E}_{\pi}\left[r_t + \gamma\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_t=s, a_t=a\right]}\\
    &= \sum_{a\in\mathcal{A(s_t)}}{\pi(a_t=a\mid s_t=s)\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\mathbb{E}_{\pi}\left[r_t + \gamma\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_t=s, a_t=a, s_{t+1}=s'\right]}}\\
    &= \sum_{a\in\mathcal{A(s_t)}}{\pi(a_t=a\mid s_t=s)\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\left(R(s_t,a_t)+\gamma\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_t=s, a_t=a, s_{t+1}=s'\right]\right)}}\\
    &= \sum_{a\in\mathcal{A(s_t)}}{\pi(a_t=a\mid s_t=s)\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\left(R(s_t,a_t)+\gamma V^{\pi}(s')\right)}}\\
\end{alignat*}$$
So we obtain the following (simplifying the notation)
$$\Rightarrow \quad V^{\pi}(s)=\sum_{a\in\mathcal{A(s)}}{\pi(a\mid s)\sum_{s'\in\mathcal{S}}{p(s'\mid s,a)\left(R(s,a)+\gamma V^{\pi}(s')\right)}}$$

---
$$\pi(a\mid s) = \begin{cases}
      1, & \text{if}\ a=\arg\max_{a'\in\mathcal{A}(s)}Q^*(s,a') \\
      0, & \text{otherwise}
    \end{cases}$$

An optimal policy will favor the action that gives the highest Q-value so it will converge to probabilities in {0, 1}, unless some actions have equal highest Q-Values, in which case the probabilities for these actions will be equal and between 0 and 1 (and choosing either of them is optimal) while the other actions with lower Q-values will have probability 0.