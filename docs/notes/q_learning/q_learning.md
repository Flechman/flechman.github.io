# Reinforcement Learning: Q-Learning \& Deep Q-Learning
* These notes present a [Reinforcement Learning](https://en.wikipedia.org/wiki/Reinforcement_learning) algorithm, namely 
Q-Learning
* Having a Probability, Stochastics and Machine Learning foundation is recommended before reading.

## Introduction

The goal of Q-learning is to learn a certain measure of quality of actions given states. 

## Framework

- We have an agent and an environment which interact with each-other in discrete time steps. At time $t$, the agent observes the environment's state $s_t \in \mathcal{S}$, and performs action $a_t \in \mathcal{A}(s_t)$. The agent gets a reward $r_t\in \mathbb{R}$ from performing this action, and the environement changes to state $s_{t+1} \in \mathcal{S}$.
- The state transition follows a distribution $p(s_{t+1}\mid s_t, a_t)$ $\;\forall s_{t+1}\in \mathcal{S}$, and we assume to have the markov property $p(s_{t+1}\mid s_0, a_0, ..., s_t, a_t) = p(s_{t+1}\mid s_t, a_t)$.
- We assume that we don't know the environment's dynamics (model free), so we don't know the state transition $p(s_{t+1}\mid s_t, a_t)$ $\;\forall s_{t+1}\in \mathcal{S}$. In other words, from $s_t, a_t$ we cannot infer anything on $s_{t+1}$.  
- We note $\mathcal{S}$ the observable state space, $\mathcal{A}$ the action space. $\mathcal{A}(s)$ is the action space when the state of the environment is $s$, and $\mathcal{A}(s) \subseteq \mathcal{A}$. 
- $R: \mathcal{S} \times \mathcal{A} \rightarrow \mathbb{R}$ is the reward function, and $r_t = R(s_t, a_t)$. Usually the notation $r_t$ will be used to denote a random variable that depends on the event $(s_t, a_t)$.
- We note a policy $\pi$ to be a strategy for the agent. We model it as a probability distribution and $\pi(a_t\mid s_t) = p(a_t\mid s_t) \in [0, 1]$.

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

$$\Rightarrow \quad V^{\pi}(s) = \sum_{a\in \mathcal{A}(s)}{\pi(a\mid s)}Q^{\pi}(s,a)$$


We'll rewrite our ultimate goal (1) as being $V^*(s)$. It is the maximum expected (discounted) cumulative reward that we can obtain from state $s$, with optimal play ($\pi^*$). We write $V^*(s) = V^{\pi^*}(s) = \max_{\pi}V^{\pi}(s)$.  
Similarly, $Q^*(s,a)$ is the the maximum expected (discounted) reward that we wan obtain by taking action $a$ from state $s$, with optimal play. $Q^*(s,a) = Q^{\pi^*}(s,a) = \max_{\pi}Q^{\pi}(s,a)$.  
Note that there can be multiple optimal policies that give the same optimal value, i.e. $\pi^*$ may not be unique.  

We now give a policy and argue that it is optimal:
$$\pi(a\mid s) = \begin{cases}
      1, & \text{if}\ a=\arg\max_{a'\in\mathcal{A}(s)}Q^*(s,a') \\
      0, & \text{otherwise}
    \end{cases}$$

An optimal policy will favor the action that gives the highest Q-value so it will converge to probabilities in {0, 1}, unless some actions have equal highest Q-Values, in which case the probabilities for these actions will be equal and between 0 and 1 (and choosing either of them is optimal) while the other actions with lower Q-values will have probability 0.  

We can derive the following important property:
$$V^*(s) = \max_{\pi}V^{\pi}(s) = \max_{\pi}\sum_{a\in\mathcal{A}(s)}{\pi(a\mid s)Q^{\pi}(s,a)} = \max_{a\in\mathcal{A}(s)}Q^*(s,a)$$
This is extremely useful, because if we follow an optimal policy, we can concentrate on computing the optimal Q-values to obtain the optimal V-function values, which is exactly our ultimate goal (1). So computing the optimal Q-values comes back to achieving our goal.  

Bellman optimality equation for $Q^*$:
$$Q^*(s,a) = R(s,a) +\gamma\sum_{s'\in\mathcal{S}}{p(s'\mid s,a)\max_{a'\in\mathcal{A}(s')}}Q^*(s',a')$$
This is obtained by noting that $(*)$ works in particular with $\pi^*$, and by combining it with $V^*(s)=\max_{a\in\mathcal{A}(s)}Q^*(s,a)$.  

This means that choosing the action which gives the highest Q-value is an optimal policy.

Computing $Q^*$ directly is generally impractical.
So we approximate $Q^*$ by solving numerically the Bellman optimality equation. To do this we learn $Q^*(s,a)$ for all $s\in\mathcal{S}, a\in\mathcal{A}(s)$ iterativelly to obtain the approximation $\tilde{Q}$.

To evaluate our approximation, we look at the Bellman error, which is simply the difference between the current Q-value when we're at $s_t$ and we're about to take $a_t$, and the Q-value computed once we observe the next state $s_{t+1}$:
$$B(s_t,a_t,s_{t+1}) = \tilde{Q}(s_t,a_t) \;-\; \underbrace{(R(s_t,a_t) + \gamma\max_{a\in\mathcal{A}(s_{t+1})}\tilde{Q}(s_{t+1},a))}_{\text{Computed once we can observe}\ s_{t+1}}$$
Intuitively, the Bellman error is the update to our expected reward when we observe $s_{t+1}$.  

Q-Learning is an algorithm that repeatedly adjusts $\tilde{Q}$ to minimize the Bellman error. At timestep $t+1$, we sample the tuple $(s_t, a_t, s_{t+1})$ and adjust $\tilde{Q}$ as follows:
$$\tilde{Q}(s_t,a_t) \leftarrow \tilde{Q}(s_t,a_t) - \alpha B(s_t,a_t,s_{t+1})$$
Where $\alpha$ is a learning rate, to average among all the different observations $(s_t,a_t,s_{t+1})$. If $\alpha =1$, we only adjust to take into account the newest value we've computed. In practice $\alpha$ will be close to 0 (for example 0.01) because we will have a good amount of training samples to average on.

We know that by following an optimal policy we obtain the optimal Q-values. 
We have an optimal policy $\pi^*$, but we need to learn the Q-values. By following the learning procedure with $\pi^*$ we guarantee that the Q-values we learn are the optimal Q-values. And these optimal Q-values validate the optimality of our policy when choosing an action, and we reach our ultimate goal of maximizing the expected (discounted) cumularive reward given a state $s$ (this closes the loop).

Note that Q-Learning only learns about the states and actions it visits. When our agent chooses actions based on the optimal policy, it might never go into certain states, and thus it misses some information that would help get closer to $Q^*$. This is the exploration-exploitation tradeoff: the agent should sometimes choose suboptimal actions in order to visit new states and actions.  
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




Now, we want to choose actions that put the agent in a state where the expected (discounted) reward is the highest possible. The State-Value function gives you the expected discounted reward when the agent is in a specific state. It gives an appreciation of the state the agent is in. Q-Learning aims at choosing states that maximize this value. But to choose a state, we need to perform an action. In math language, if we're in $s_t$ and $s_{t+1}$ gives a good expected (discounted) reward, we need to choose the appropriate $a_t$ that gets the agent to $s_{t+1}$. We can't aim at a certain $s_{t+1}$, because we don't have access to it even when choosing action $a_t$ (model-free assumption). This is where the Q-function comes into place, which uses only $s_t$ and $a_t$, and directly links to the State-value function (which is our target of maximization). Intuitively, the Q-function gives measure of the quality of an action. We'll see that from $s_t$, choosing the action that gives the highest value in the Q-function, in math terms choosing $\arg\max_a Q(s_t, a)$ results in choosing $s_{t+1}$ that gives the highest $V(s_{t+1})$ for $t+1$.

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